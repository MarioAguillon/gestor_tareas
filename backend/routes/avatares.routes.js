const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const avatarsDir = path.join(__dirname, '../public/avatars');
  try {
    if (fs.existsSync(avatarsDir)) {
      const files = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      res.json(files);
    } else {
      res.json([
        'avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg', 'avatar4.jpg',
        'avatar5.jpg', 'avatar6.jpg', 'avatar7.jpg', 'avatar8.jpg'
      ]);
    }
  } catch(e) {
    res.json([
      'avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg', 'avatar4.jpg',
      'avatar5.jpg', 'avatar6.jpg', 'avatar7.jpg', 'avatar8.jpg'
    ]);
  }
});

module.exports = router;
