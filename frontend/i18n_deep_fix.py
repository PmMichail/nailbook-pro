import os
import re
import uuid

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If file doesn't import useTranslation, we'll need to add it manually if it changes
    original_content = content
    
    # 1. Replace >Text<
    # Regex looks for > followed by optional whitespace, then Cyrillic text, then <
    def replacer_text(match):
        prefix = match.group(1)
        text = match.group(2)
        suffix = match.group(3)
        # Skip if it already contains t(
        if 't(' in text:
            return match.group(0)
        
        # We need a key
        key = f"auto_{uuid.uuid4().hex[:8]}"
        return f"{prefix}{{t('{key}', {{defaultValue: '{text}'}})}}{suffix}"
        
    content = re.sub(r'(>\s*)([А-Яа-яІіЇїЄєҐґ0-9 \.,!\?\'"()]+)(\s*<)', replacer_text, content)
    
    # 2. Replace placeholder="..."
    def replacer_placeholder(match):
        prefix = match.group(1)
        text = match.group(2)
        suffix = match.group(3)
        if 't(' in text:
            return match.group(0)
        key = f"auto_{uuid.uuid4().hex[:8]}"
        return f"{prefix}{{t('{key}', {{defaultValue: '{text}'}})}}{suffix}"

    content = re.sub(r'(placeholder=")([А-Яа-яІіЇїЄєҐґ0-9 \.,!\?\'"()]+)(")', replacer_placeholder, content)

    # 3. Replace title="..."
    content = re.sub(r'(title=")([А-Яа-яІіЇїЄєҐґ0-9 \.,!\?\'"()]+)(")', replacer_placeholder, content)

    # 4. Replace string literals in variables like 'Ціна:'
    # Be careful not to replace imports or random code
    # We will only do this manually for the user's explicit complaints if needed, 
    # to avoid breaking JS logic.

    if content != original_content:
        # check if useTranslation is imported
        if "useTranslation" not in content:
            content = "import { useTranslation } from 'react-i18next';\n" + content
            
            # also need to instantiate it inside the component: const { t } = useTranslation();
            # find the first component definition
            comp_match = re.search(r'(export const \w+\s*=\s*\([^)]*\)\s*=>\s*{)', content)
            if comp_match:
                content = content.replace(comp_match.group(1), comp_match.group(1) + "\n  const { t } = useTranslation();\n")
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

