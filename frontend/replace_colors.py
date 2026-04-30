import os

pink1 = '#FF69B4'
pink2 = '#FFB6C1'
new1 = '#C88D7A'
new2 = '#e0c0b4'

target_dirs = [
    '/Users/mac/.gemini/antigravity/scratch/nailbook-pro/frontend/src/screens',
    '/Users/mac/.gemini/antigravity/scratch/nailbook-pro/frontend/src/navigation'
]

for d in target_dirs:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if pink1 in content or pink2 in content:
                    content = content.replace(pink1, new1).replace(pink2, new2)
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Replaced colors in {path}")
