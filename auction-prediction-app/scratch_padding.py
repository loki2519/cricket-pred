import os
import re

dir_path = r'c:\Users\maddi\Desktop\cricket pred\auction-prediction-app\src\screens'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace(
        "contentContainerStyle={{ padding: 20 }}",
        "contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}"
    )
    new_content = new_content.replace(
        "style={{ padding: 20, flex: 1 }}",
        "style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, flex: 1 }}"
    )


    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for root, _, files in os.walk(dir_path):
    for fn in files:
        if fn.endswith('.js'):
            filepath = os.path.join(root, fn)
            process_file(filepath)

print("Done")
