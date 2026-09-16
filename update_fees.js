const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'wilayasData.json');
let data = require(filePath);

let modifiedCount = 0;

data.forEach(w => {
  w.communes.forEach(c => {
    if (c.domicile.fee_da === 450) {
      c.domicile.fee_da = 500;
      modifiedCount++;
    } else if (c.domicile.fee_da === 750) {
      c.domicile.fee_da = 700;
      modifiedCount++;
    }

    if (c.stop_desk.fee_da === 450) {
      c.stop_desk.fee_da = 500;
      modifiedCount++;
    } else if (c.stop_desk.fee_da === 750) {
      c.stop_desk.fee_da = 700;
      modifiedCount++;
    }
  });
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Updated ${modifiedCount} delivery fees successfully.`);
