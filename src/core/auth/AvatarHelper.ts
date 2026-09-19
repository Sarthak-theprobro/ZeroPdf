/**
 * INTELLIGENT AVATAR & NAME DETECTOR
 * Analyzes name linguistics to provide luxury high-res avatars matching the user.
 */

const FEMALE_NAMES = new Set([
  'emma', 'olivia', 'sophia', 'ava', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn',
  'priya', 'ananya', 'sneha', 'pooja', 'neha', 'divya', 'rhea', 'tanvi', 'aarti', 'kavya',
  'sarah', 'rachel', 'jessica', 'emily', 'laura', 'maria', 'elena', 'chloe', 'zoe', 'lily',
  'anna', 'clara', 'eva', 'lucia', 'hannah', 'maya', 'alicia', 'natalie', 'vanessa', 'leila'
]);

const MALE_NAMES = new Set([
  'liam', 'noah', 'oliver', 'james', 'william', 'benjamin', 'lucas', 'henry', 'alexander', 'mason',
  'aarav', 'rohan', 'rahul', 'sarthak', 'aditya', 'vikram', 'amit', 'kunal', 'arjun', 'varun',
  'david', 'michael', 'john', 'daniel', 'chris', 'matthew', 'ryan', 'nathan', 'ethan', 'samuel',
  'carlos', 'marco', 'leo', 'max', 'gabriel', 'julian', 'sebastian', 'victor', 'arthur', 'omar'
]);

// Curated Ultra-High-Res Studio Portraits
const FEMALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
];

const MALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
];

export class AvatarHelper {
  /**
   * Cleans name and formats cleanly (e.g. "sarthak" -> "Sarthak")
   */
  public static formatName(inputName: string, email?: string): string {
    if (inputName && inputName.trim()) {
      return inputName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    if (email) {
      const local = email.split('@')[0].replace(/[._-]/g, ' ');
      return local.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return 'Document Pilot';
  }

  /**
   * Intelligently selects high-resolution profile portrait matching the user's name
   */
  public static getSmartAvatar(name: string): string {
    const firstName = name.toLowerCase().split(' ')[0] || '';
    
    // Check feminine name list
    if (FEMALE_NAMES.has(firstName)) {
      const idx = Math.abs(firstName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % FEMALE_PORTRAITS.length;
      return FEMALE_PORTRAITS[idx];
    }
    
    // Check masculine name list
    if (MALE_NAMES.has(firstName)) {
      const idx = Math.abs(firstName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % MALE_PORTRAITS.length;
      return MALE_PORTRAITS[idx];
    }

    // Default: High-tech 3D Cyber Avatar based on initial seed
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}&backgroundColor=0c101c`;
  }
}