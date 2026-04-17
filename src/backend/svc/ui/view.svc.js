const { FsUtil } = require('#utils');
const { APP_CNF } = require('#cnf');

const ViewSvc = {
    loadHtml: (htmlPath) => FsUtil.readHtml(FsUtil.join(APP_CNF.uiDir, `${htmlPath}.html`))
}

module.exports = ViewSvc;