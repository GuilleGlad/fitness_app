
const cleanURL = (url) => {
    return url.replaceAll("blob:","");
};
exports.cleanURL = cleanURL;
