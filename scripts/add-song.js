// Script to help add songs to the music player playlist
// Usage: node scripts/add-song.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Make sure we have a public/music directory
const musicDir = path.join(process.cwd(), 'public', 'music');
ensureDirectoryExists(musicDir);

console.log('=== Galaxy Trek Music Player - Add Song ===');
console.log('This script will help you add songs to your playlist.');
console.log('Songs should be placed in the public/music directory.\n');

rl.question('Have you already placed the MP3 file in the public/music directory? (y/n) ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\nPlease copy your MP3 files to the public/music directory first, then run this script again.');
    rl.close();
    return;
  }

  // List files in the music directory
  const files = fs.readdirSync(musicDir).filter(file => file.endsWith('.mp3'));
  
  if (files.length === 0) {
    console.log('\nNo MP3 files found in the public/music directory. Please add some files first.');
    rl.close();
    return;
  }

  console.log('\nFound the following MP3 files:');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });

  // Get the playlist file path
  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  
  // Read the current playlist
  fs.readFile(pagePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading page.tsx file:', err);
      rl.close();
      return;
    }

    // Find the playlist definition
    const playlistStartRegex = /const spacePlaylist = \[/;
    const playlistEndRegex = /\];/;
    
    const startMatch = data.match(playlistStartRegex);
    const endMatch = data.match(playlistEndRegex);
    
    if (!startMatch || !endMatch) {
      console.error('Could not find playlist in page.tsx');
      rl.close();
      return;
    }

    const startIndex = startMatch.index + startMatch[0].length;
    const endIndex = data.indexOf('];', startIndex);
    
    // Extract current playlist content
    const playlistContent = data.substring(startIndex, endIndex).trim();
    
    // Add new songs
    rl.question('\nWhich file(s) would you like to add to the playlist? (Enter comma-separated numbers, e.g. 1,2): ', (fileNumbers) => {
      const selectedIndices = fileNumbers.split(',').map(n => parseInt(n.trim()) - 1);
      const selectedFiles = selectedIndices.filter(i => i >= 0 && i < files.length).map(i => files[i]);
      
      if (selectedFiles.length === 0) {
        console.log('No valid files selected.');
        rl.close();
        return;
      }

      console.log('\nAdding the following files to the playlist:');
      selectedFiles.forEach(file => console.log(`- ${file}`));
      
      // Generate new entries for the playlist
      const newEntries = selectedFiles.map(file => {
        // Generate a readable title from filename (remove extension, replace hyphens with spaces)
        const defaultTitle = file.replace('.mp3', '').replace(/-/g, ' ');
        
        return `
  { 
    src: '/music/${file}', 
    title: '${defaultTitle}' 
  },`;
      }).join('');
      
      // If the playlist is empty (or just has comments), make sure we have proper formatting
      const updatedContent = playlistContent.includes('src:') ? 
        playlistContent + newEntries : 
        newEntries;
      
      // Create the updated file content
      const updatedData = 
        data.substring(0, startIndex) + 
        updatedContent + 
        data.substring(endIndex);
      
      // Write back to the file
      fs.writeFile(pagePath, updatedData, 'utf8', (err) => {
        if (err) {
          console.error('Error updating page.tsx:', err);
          rl.close();
          return;
        }
        
        console.log('\nPlaylist updated successfully!');
        console.log('Your songs have been added to the playlist in app/page.tsx.');
        rl.close();
      });
    });
  });
}); 