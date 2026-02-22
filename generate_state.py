import os

OUTPUT_FILE = "project_state.txt"
EXCLUDE_DIRS = {'.git', 'venv', 'node_modules', '__pycache__', '.next', '.mypy_cache'}
FILES_TO_INCLUDE = [
    "main.py",
    "frontend/src/components/AuctionCard.tsx",
    "frontend/src/components/RazorpayCheckout.tsx"
]

def generate_tree(startpath):
    tree_str = "================================================================================\n"
    tree_str += "DIRECTORY TREE\n"
    tree_str += "================================================================================\n\n"
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            tree_str += f"{subindent}{f}\n"
    return tree_str

def get_file_content(filepath):
    content_str = "\n================================================================================\n"
    content_str += f"FILE: {filepath}\n"
    content_str += "================================================================================\n\n"
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content_str += f.read()
    except Exception as e:
        content_str += f"Error reading file: {e}\n"
    return content_str

if __name__ == "__main__":
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        out_f.write(generate_tree('.'))
        for f_path in FILES_TO_INCLUDE:
            out_f.write(get_file_content(f_path))
    
    print(f"Successfully generated {OUTPUT_FILE}")
