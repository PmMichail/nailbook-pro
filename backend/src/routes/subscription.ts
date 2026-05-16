import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/master/subscription/pay
// Endpoint to serve the HTML form to the WebBrowser
router.get('/pay', async (req: any, res) => {
  res.status(410).send('PRO subscriptions are purchased through App Store and Google Play in-app purchases.');
});

router.use(authenticate);

// GET /api/master/subscription
router.get('/', async (req: any, res) => {
  try {
    const masterId = req.user.id;
    let sub = await prisma.subscription.findUnique({
      where: { masterId }
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          masterId,
          plan: 'FREE',
          status: 'ACTIVE'
        }
      });
    }
    
    // Auto-expire trials
    if (sub.status === 'TRIAL' && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
       sub = await prisma.subscription.update({
           where: { masterId },
           data: { status: 'EXPIRED' }
       });
    }
    
    // Auto-expire pro
    if (sub.plan === 'PRO' && sub.status === 'ACTIVE' && sub.currentPeriodEnd && new Date() > sub.currentPeriodEnd) {
       sub = await prisma.subscription.update({
           where: { masterId },
           data: { status: 'EXPIRED' }
       });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const clientCount = await prisma.user.count({
      where: { 
          masterId, 
          role: 'CLIENT',
          OR: [
              { isActiveClient: true },
              { myAppointments: { some: { date: { gte: thirtyDaysAgo } } } }
          ] 
      }
    });

    res.json({
        subscription: sub,
        activeClientsCount: clientCount
    });
  } catch (err) {
    console.error('[SUB GET ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/master/subscription/trial
// Starts a 14-day free trial (one time)
router.post('/trial', async (req: any, res) => {
   try {
      const masterId = req.user.id;
      const sub = await prisma.subscription.findUnique({ where: { masterId } });
      
      if (!sub || (sub.plan === 'PRO' || sub.status === 'TRIAL' || sub.status === 'EXPIRED')) {
          return res.status(400).json({ error: 'Тріал вже використано або ви вже на тарифі Pro' });
      }
      
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
      const updated = await prisma.subscription.update({
          where: { masterId },
          data: {
              plan: 'PRO',
              status: 'TRIAL',
              trialEndsAt,
              currentPeriodEnd: trialEndsAt
          }
      });
      
      res.json(updated);
   } catch (e) {
       res.status(500).json({ error: 'Internal server error' });
   }
});

// POST /api/master/subscription/checkout
router.post('/checkout', async (req: any, res) => {
  try {
    const masterId = req.user.id;
    const orderId = `sub_${masterId}_${Date.now()}`;
    
    // Fallback constants
    const publicKey = process.env.LIQPAY_PUBLIC_KEY || 'i89524650072';
    const privateKey = process.env.LIQPAY_PRIVATE_KEY || 'fc6PWMwymjvXs6RNIGTTyuMsuY7zv1XWWMEsxVHP';
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;

    if (!publicKey || !privateKey) {
        return res.status(500).json({ error: 'LiqPay не сконфігуровано' });
    }

    let proPrice = 299;
    const config = await prisma.systemConfig.findUnique({ where: { key: 'PRO_PRICE' } });
    if (config && config.value) {
        proPrice = parseInt(config.value, 10);
    }

    const payload = {
       public_key: publicKey,
       version: 3,
       action: 'pay',
       amount: proPrice,
       currency: 'UAH',
       description: 'Підписка PRO на NailsBook',
       order_id: orderId,
       server_url: `${serverUrl}/api/webhooks/liqpay`,
       result_url: `${serverUrl}/api/webhooks/liqpay/success`,
       // Testing sandbox parameter. When ready for prod, we can remove it or map it.
       // However, the 'sandbox' parameter forces the payment into a test gateway.
       sandbox: 1
    };

    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const dataString = dataBuffer.toString('base64');
    
    const crypto = await import('crypto');
    const signatureString = crypto.createHash('sha1').update(privateKey + dataString + privateKey).digest('base64');

    // We will save the HTML in a temporary cache or just generate it on the fly in a GET request.
    // The best way for React Native WebBrowser is to have a GET endpoint that renders the form.
    // We will return the URL to our new GET endpoint:
    const paymentUrl = `${serverUrl}/api/master/subscription/pay?order=${orderId}`;

    res.json({
      paymentUrl,
      orderId
    });
  } catch (err) {
    console.error('[CHECKOUT ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// DELETE /api/master/subscription
router.delete('/', async (req: any, res) => {
  try {
    const masterId = req.user.id;
    const sub = await prisma.subscription.findUnique({ where: { masterId } });
    if (sub && sub.plan === 'PRO') {
       await prisma.subscription.update({
           where: { masterId },
           data: {
               status: 'CANCELLED'
           }
       });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
