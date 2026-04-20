import json
import os

def sort_lugat():
    file_path = r'c:\Users\e.bilolov\Desktop\lugat\lugat.json'
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sorted_data = {}
    
    for category, words in data.items():
        # Some entries use 'uz', others use 'translation'
        # We sort by the Uzbek word
        sorted_words = sorted(
            words, 
            key=lambda x: (x.get('uz') or x.get('translation') or '').lower()
        )
        sorted_data[category] = sorted_words

    # Write back to file with indentation for readability
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)
    
    print("Alphabetical sorting completed successfully.")

if __name__ == "__main__":
    sort_lugat()
