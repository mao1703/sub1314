const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const clientDir = path.join(rootDir, 'client');
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Starting Vercel Build...');

(async () => {
try {
  // 1. Install and Build Client
  console.log('📦 Installing and building client...');
  execSync('npm install && npm run build', { 
    cwd: clientDir, 
    stdio: 'inherit',
    shell: true 
  });

  // 2. Prepare Dist Directory
  console.log('Cc Cleaning and preparing dist directory...');
  try {
    if (fs.existsSync(distDir)) {
      // Try to rename it first to move it out of the way (atomic on same drive)
      // or just try to delete.
      // On Windows/Vercel, simple removal is best.
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.log('Warning: Could not remove dist dir:', e.message);
  }

  // Small delay to ensure FS lock release
  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. Copy Artifacts
  console.log('📂 Copying build artifacts...');
  const clientDist = path.join(clientDir, 'dist');
  
  if (fs.existsSync(clientDist)) {
    // Ensure parent dir exists (it should)
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy files individually to avoid "directory inside directory" confusion or locking issues
    // and to be more explicit
    const files = fs.readdirSync(clientDist);
    for (const file of files) {
        const srcPath = path.join(clientDist, file);
        const destPath = path.join(distDir, file);
        console.log(`Copying ${file}...`);
        try {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } catch (copyError) {
            console.error(`Error copying ${file}:`, copyError);
            // Fallback for directory
            if (fs.lstatSync(srcPath).isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                // copy content? Too complex.
                // Just fail explicitly.
                throw copyError;
            }
        }
     }
     
     console.log('✅ Build artifacts copied to root dist/');
   } else {
     throw new Error('Client build directory not found!');
   }

   console.log('🎉 Vercel Build Complete!');
} catch (error) {
  console.error('❌ Build Failed:', error.message);
  process.exit(1);
}
})();
