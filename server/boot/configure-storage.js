module.exports = function(app) {
    //Function for checking the file type
    app.dataSources.storage.connector.getFilename = function(file, req, res) {
        //Filter file type for images
        var pattern = /^image\/.+$/;
        var value = pattern.test(file.type);
        if(value ){
            var fileExtension = file.name.split('.').pop();
            var fileName = file.name.substr(0, file.name .lastIndexOf('.')) || file.name;
            var container = file.container;
            var time = new Date().getTime();
            var query = req.query;
            //Modify file name with date
            var NewFileName = '' + fileName + '_' + time + '.' + fileExtension;
            //And the file name will be saved as defined..
            return NewFileName;
        }
        else{
            throw "FileTypeError: Only File of Image type is accepted.";
        }
    };
}