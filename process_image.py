from rembg import remove
from PIL import Image
import os

input_path = '/Users/tejaspatel/TEJASKPAI/public/female_robot_standing.png'
output_path = '/Users/tejaspatel/TEJASKPAI/public/female_robot_transparent.png'

print(f"Processing {input_path}...")
try:
    with open(input_path, 'rb') as i:
        input_data = i.read()
        output_data = remove(input_data)
        with open(output_path, 'wb') as o:
            o.write(output_data)
    print(f"Saved transparent image to {output_path}")
except Exception as e:
    print(f"Error: {e}")
