import os
import re
import json

keys_found = {}

# Regex to match t('key', {defaultValue: 'value'})
# It handles single or double quotes
pattern = re.compile(r"t\(['\"]([^'\"]+)['\"]\s*,\s*\{\s*defaultValue\s*:\s*['\"]([^'\"]+)['\"]\s*\}\)")

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                matches = pattern.findall(content)
                for match in matches:
                    key = match[0]
                    val = match[1]
                    keys_found[key] = val

# Also check components
for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                matches = pattern.findall(content)
                for match in matches:
                    key = match[0]
                    val = match[1]
                    keys_found[key] = val

with open('missing_keys.json', 'w') as f:
    json.dump(keys_found, f, indent=2, ensure_ascii=False)

print(f"Found {len(keys_found)} translation keys with default values.")
