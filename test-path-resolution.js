/**
 * Script di test per verificare la risoluzione dei percorsi delle immagini
 */

const path = require('path');
const fs = require('fs');

// Simula la funzione getLocalImagePath
function getLocalImagePath(src) {
  if (!src) {
    throw new Error('Image source is required');
  }

  console.log(`🔍 [TEST] Input src: ${src}`);

  // If it's already an absolute path, return as is
  if (path.isAbsolute(src)) {
    console.log(`🔍 [TEST] Already absolute path: ${src}`);
    return src;
  }

  let resolvedPath;

  // If it starts with /uploads/, remove the leading slash and join with backend directory
  if (src.startsWith('/uploads/')) {
    const relativePath = src.substring(1); // Remove leading slash
    resolvedPath = path.join(__dirname, 'backend', relativePath);
  } 
  // If it starts with uploads/ (no leading slash), join with backend directory
  else if (src.startsWith('uploads/')) {
    resolvedPath = path.join(__dirname, 'backend', src);
  }
  // If it's just a filename, assume it's in uploads directory
  else {
    resolvedPath = path.join(__dirname, 'backend', 'uploads', src);
  }
  
  console.log(`🔍 [TEST] Resolved ${src} -> ${resolvedPath}`);
  
  // Check if file exists and log the result
  const fileExists = fs.existsSync(resolvedPath);
  console.log(`🔍 [TEST] File exists: ${fileExists}`);
  
  if (!fileExists) {
    // Try alternative paths if the main one doesn't exist
    const alternatives = [
      path.join(__dirname, 'backend', 'uploads', path.basename(src)),
      path.join(process.cwd(), 'backend', 'uploads', path.basename(src)),
      path.join(process.cwd(), 'uploads', path.basename(src))
    ];
    
    console.log(`🔍 [TEST] File not found, trying alternatives...`);
    
    for (const altPath of alternatives) {
      console.log(`🔍 [TEST] Trying: ${altPath}`);
      if (fs.existsSync(altPath)) {
        console.log(`✅ [TEST] Found file at alternative path: ${altPath}`);
        return altPath;
      }
    }
    
    console.log(`❌ [TEST] File not found in any location for: ${src}`);
  }
  
  return resolvedPath;
}

// Test con il file problematico
console.log('🧪 [TEST] Testing path resolution...\n');

const testSrc = '/uploads/--1758842227345-536255675.png';
console.log(`Testing with: ${testSrc}`);

try {
  const resolvedPath = getLocalImagePath(testSrc);
  console.log(`\n✅ [TEST] Final resolved path: ${resolvedPath}`);
  
  // Verifica finale
  if (fs.existsSync(resolvedPath)) {
    console.log(`✅ [TEST] SUCCESS: File found at resolved path!`);
    
    // Mostra info del file
    const stats = fs.statSync(resolvedPath);
    console.log(`📊 [TEST] File size: ${stats.size} bytes`);
    console.log(`📅 [TEST] Modified: ${stats.mtime}`);
  } else {
    console.log(`❌ [TEST] FAILED: File not found at resolved path`);
  }
  
} catch (error) {
  console.error(`❌ [TEST] Error:`, error.message);
}

console.log('\n🔍 [TEST] Directory listing:');
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
console.log(`📁 [TEST] Uploads directory: ${uploadsDir}`);

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log(`📋 [TEST] Files in uploads directory (${files.length}):`);
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
} else {
  console.log(`❌ [TEST] Uploads directory not found!`);
}