const { Client } = require('pg');
require('dotenv').config();
const c = new Client(process.env.DIRECT_URL);
c.connect().then(async () => {
  const { rows } = await c.query("INSERT INTO business_invites (business_id, created_by) VALUES ('ad5f25d1-7f7e-4cd1-8336-d397e5919d6b', 'f10d8c15-ad18-4b87-b6a4-24428a20967d') RETURNING id");
  console.log('Invite Link: http://localhost:5173/business/cong-ty-tnhh-sansin?invite=' + rows[0].id);
  c.end();
}).catch(console.error);
