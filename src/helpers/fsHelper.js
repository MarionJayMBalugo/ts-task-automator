// Get the current drive name (e.g., "E:\Folder" -> "E:")
// td = target drive string, fp = fallback string
const getDrv = (td, fp) => (td || fp).charAt(0) + ':';

module.exports = {
    getDrv
};