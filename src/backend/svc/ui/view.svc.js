const { FsUtil } = require('#utils/index.js');
const { APP_CNF } = require('#cnf/index.js');

const ViewSvc = {
    loadHtml: (htmlPath) => FsUtil.readHtml(FsUtil.join(APP_CNF.uiDir, `${htmlPath}.html`))
}

module.exports = ViewSvc;