from PIL import Image
import numpy as np
import sys

input_path = '/Users/tejaspatel/TEJASKPAI/public/female_robot_standing.png'
output_path = '/Users/tejaspatel/TEJASKPAI/public/female_robot_transparent.png'

print("Running simple background removal...")
try:
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)
    
    # Simple threshold for white background (assuming >240 is white)
    # The image is channel-last (H, W, 4)
    # Transpose to (4, H, W) for easier unpacking if needed, or just index
    
    # Let's do vectorized mask
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Mask: White-ish pixels
    mask = (r > 230) & (g > 230) & (b > 230)
    
    # Set alpha to 0 where mask is True
    data[:,:,3][mask] = 0
    
    result = Image.fromarray(data)
    result.save(output_path)
    print(f"Saved simple transparent image to {output_path}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
