const p = require('path');
const j = p.join; // Use 'j' as a tiny alias for path.join

const DF_DRV = 'E'; // DEFAULT DRIVE
const CUST_DIR = 'customer'; // wai-customer folder name
const WEB_DIR = 'default'; // wai-web folder name
const CUST_PATH = 'vendor\\timeless'; // wai-customer folder path
const WEB_PATH = 'resources\\resources\\www'; // wai-web folder path
const TMS_DIR = 'tms-dos'; // tms-dos root
const FC_DIR = j(TMS_DIR, WEB_PATH, WEB_DIR, CUST_PATH, CUST_DIR); // full wai-customer path

module.exports = {
    TMS_DIR,
    DF_DRV,
    CUST_DIR,
    WEB_DIR,
    CUST_PATH,
    WEB_PATH,
    FC_DIR
};