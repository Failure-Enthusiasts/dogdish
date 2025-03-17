# PDF Handler, python scripts that extracts the text information from the PDF and turns it into a JSON object.
# The JSON object will be used to store the menu information for the day.
import re
import json
from PyPDF2 import PdfReader

def scrape_menu(pdf_file_path):
    # Hard-code the date from user requirement
    date_str = "2025-02-03"
    cater_name = None
    food_items = []

    # Regex to detect a line that starts with "Contains:"
    contains_pattern = re.compile(r"^.*Contains:\s*(.*)$", re.IGNORECASE)
    preference_pattern = re.compile(r"^Preference:\s*(.*)$", re.IGNORECASE)

    # Open the PDF
    reader = PdfReader(pdf_file_path)
    lines = []

    # Extract text from each page
    for page in reader.pages:
        page_text = page.extract_text()
        print(page_text)
        if page_text:
            # Split text into lines
            # Split on newlines, strip whitespace
            page_lines = [l.strip() for l in page_text.split('\n') if l.strip()]
            # print(page_lines)
            lines.extend(page_lines)


            # DELETE: page_lines = page_text.split('\n')
            # Clean up whitespace
            # lines.extend([l.strip() for l in page_lines if l.strip()])

    skip_lines = [
        "app.zerocater.com/dashboard"
    ]

    # The first line is assumed to be the caterer name (e.g. "Mighty Quinn's BBQ")
    if lines:
        cater_name = lines[0]
    else:
        cater_name = "Unknown Caterer"

    # Start parsing from the second line onward
    i = 7
    while i < len(lines):
        line = lines[i]

        # If this line is in skip_lines, ignore it
        if line in skip_lines:
            i += 1
            continue

        # If the line does not match "Contains:", treat it as a dish name
        if "Contains:" not in line and not preference_pattern.match(line): # similar to code to below but without the preference_pattern
        # if "Contains:" not in line:
            dish_name = line
            dish_description = ""
            dish_allergens = []
            dish_preferences = []

            # Look ahead for description lines or allergens
            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                
                # If next line is in skip_lines, we break (new section or heading)
                if next_line in skip_lines:
                    break

                # If next line is "Contains:...", parse allergens
                if contains_pattern.match(next_line):
                    match = contains_pattern.match(next_line)
                    if match:
                        allergens_str = match.group(1)
                        dish_allergens = [a.strip() for a in allergens_str.split(',')]
                    j += 1
                    break
                
                 # If next line is 'Preference:', parse preference
                elif preference_pattern.match(next_line):
                    pref_str = preference_pattern.match(next_line).group(1)
                    # Example: if the PDF line says: "Preference: Gluten Free=example link"
                    # you could parse out the name and symbol here:
                    if '=' in pref_str:
                        name_part, symbol_part = pref_str.split('=', 1)
                        dish_preferences.append({
                            "name": name_part.strip(),
                            "symbol": symbol_part.strip()
                        })
                    else:
                        # If there's no symbol, just store the preference name
                        dish_preferences.append({
                            "name": pref_str.strip(),
                            "symbol": ""
                        })
                    j += 1
                    
                # If next line might be a new dish name (and not "Contains:")
                # we break so we can parse it as a new dish
                if re.search(r"^.*Contains:", next_line, re.IGNORECASE):
                    break

                # else:
                #     dish_description += next_line + " "
                #     j += 1

                # Otherwise, consider it part of the description
                dish_description += (next_line + " ")
                j += 1

            # Build the item dictionary
            item = {
                "name": dish_name,
                "description": dish_description.strip(),
                # Hard-coded preference from your guideline
                "preference": dish_preferences,
                "allergen": dish_allergens
            }
            food_items.append(item)
            # Advance the main index
            i = j
        else:
            # If line starts with "Contains:", skip it
            i += 1

    # Build the final JSON structure
    output = {
        "event": [
            {
                "date": date_str,
                "cater": cater_name,
                "food": food_items
            }
        ]
    }

    return output

if __name__ == "__main__":
    pdf_file_path = "test-menu.pdf"  # Replace with your actual PDF path
    result = scrape_menu(pdf_file_path)

    # Print or save the JSON
    print(json.dumps(result, indent=2))


   # ----------------------------
#     import re
# import json
# from PyPDF2 import PdfReader

# def parse_test_menu(pdf_file_path):
#     # We'll store the final dishes here
#     dishes = []

#     # Regex to find "Contains:" (case-insensitive)
#     contains_pattern = re.compile(r"(.*)Contains:\s*(.*)", re.IGNORECASE)

#     # Open PDF
#     reader = PdfReader(pdf_file_path)
#     lines = []

#     for page in reader.pages:
#         text = page.extract_text()
#         if text:
#             # Split on newlines, strip whitespace
#             page_lines = [l.strip() for l in text.split('\n') if l.strip()]
#             lines.extend(page_lines)

#     # Let's figure out which lines to skip or treat as headings
#     # We might do something like:
#     skip_lines = [
#         "Som Bo Lunch",
#         "Monday, January 13",
#         "For more info, scan QR code or visit app.zerocater.com/dashboard"
#     ]

#     # The first line is "Som Bo" -> cater name
#     cater_name = lines[0] if lines else "Unknown Caterer"

#     i = 1  # Start from second line
#     while i < len(lines):
#         line = lines[i]

#         # If this line is in skip_lines, ignore it
#         if line in skip_lines:
#             i += 1
#             continue

#         # If the line has "Contains:" inside it, we likely need to split
#         # but this might not be the start of a new dish.
#         # We'll check if the line looks like a dish or partial description.

#         # We'll assume a "dish name" is any line that does NOT contain "Contains:"
#         # and is not in skip_lines
#         if "Contains:" not in line:
#             dish_name = line
#             dish_description = ""
#             dish_allergens = []

#             # Move forward to collect description or allergens
#             j = i + 1
#             while j < len(lines):
#                 next_line = lines[j]

#                 # If next line is in skip_lines, we break (new section or heading)
#                 if next_line in skip_lines:
#                     break

#                 # Check if next line has "Contains:"
#                 match = contains_pattern.match(next_line)
#                 if match:
#                     # The part before "Contains:" is more description
#                     # The part after is allergens
#                     possible_desc = match.group(1).strip()
#                     allergens_str = match.group(2).strip()

#                     # If there's any leftover description text, add it
#                     if possible_desc:
#                         if dish_description:
#                             dish_description += " " + possible_desc
#                         else:
#                             dish_description = possible_desc

#                     # Parse allergens by splitting on commas
#                     dish_allergens = [a.strip() for a in allergens_str.split(',')]
#                     j += 1
#                     break
#                 else:
#                     # If it doesn't have "Contains:", maybe it's more description
#                     # But we also need to check if it's the start of a new dish
#                     # A simple heuristic: if the next line is capitalized and short,
#                     # it might be a new dish. But let's keep it simpler:
#                     # We'll only stop if we see "Contains:" or skip_lines
#                     if dish_description:
#                         dish_description += " " + next_line
#                     else:
#                         dish_description = next_line
#                     j += 1

#             # We've collected dish_name, dish_description, dish_allergens
#             dishes.append({
#                 "name": dish_name,
#                 "description": dish_description.strip(),
#                 "preference": [],  # or infer if needed
#                 "allergen": dish_allergens
#             })

#             # Move main pointer
#             i = j
#         else:
#             # If the line itself starts with "Contains:", it's probably an error in structure
#             # or we skip it
#             i += 1

#     # Build final JSON
#     output = {
#         "event": [
#             {
#                 "date": "02-03-2025",
#                 "cater": cater_name,
#                 "food": dishes
#             }
#         ]
#     }

#     return output

# if __name__ == "__main__":
#     pdf_file_path = "test-menu.pdf"
#     result = parse_test_menu(pdf_file_path)
#     print(json.dumps(result, indent=2))
