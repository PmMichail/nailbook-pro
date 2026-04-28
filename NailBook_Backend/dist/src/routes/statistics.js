"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Допоміжний мідлвар для захисту роутів
const requireMaster = (req, res, next) => {
    if (req.user.role !== 'MASTER')
        return res.status(403).json({ error: 'Тільки для майстрів' });
    next();
};
router.get('/overview', requireMaster, async (req, res) => {
    try {
        const masterId = req.user.id;
        // Всього унікальних клієнтів
        const appointments = await prismaClient_1.default.appointment.findMany({
            where: { masterId },
            include: { service: true }
        });
        const uniqueClients = new Set(appointments.map(a => a.clientId)).size;
        const totalRevenue = appointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
        const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED').length;
        const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
        const cancelRate = appointments.length ? ((cancelledAppointments / appointments.length) * 100).toFixed(1) : 0;
        res.json({
            totalClients: uniqueClients,
            totalAppointments: appointments.length,
            confirmedAppointments,
            totalRevenue,
            cancelRate: `${cancelRate}%`
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка отримання статистики' });
    }
});
router.get('/export/excel', requireMaster, async (req, res) => {
    try {
        const appointments = await prismaClient_1.default.appointment.findMany({
            where: { masterId: req.user.id },
            include: { client: true, service: true }
        });
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('Записи');
        sheet.columns = [
            { header: 'Клієнт', key: 'client', width: 20 },
            { header: 'Послуга', key: 'service', width: 25 },
            { header: 'Сума', key: 'price', width: 10 },
            { header: 'Дата', key: 'date', width: 20 },
            { header: 'Статус', key: 'status', width: 15 }
        ];
        appointments.forEach(a => {
            sheet.addRow({
                client: a.client.name,
                service: a.service.name,
                price: a.service.price,
                date: new Date(a.startTime).toLocaleDateString(),
                status: a.status
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'statistics.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка експорту в Excel' });
    }
});
router.get('/export/pdf', requireMaster, async (req, res) => {
    try {
        const doc = new pdfkit_1.default();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        doc.pipe(res);
        doc.fontSize(20).text('Звіт Майстра', { align: 'center' });
        doc.moveDown();
        const appointments = await prismaClient_1.default.appointment.count({ where: { masterId: req.user.id } });
        doc.fontSize(14).text(`Всього записів у системі: ${appointments}`);
        doc.text(`Звіт згенеровано: ${new Date().toLocaleDateString()}`);
        doc.end();
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка експорту в PDF' });
    }
});
exports.default = router;
//# sourceMappingURL=statistics.js.map