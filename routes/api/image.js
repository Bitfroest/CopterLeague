const uuid = require('node-uuid');
const lwip = require('lwip');
const AWS = require('aws-sdk');
const multer  = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 1024 * 1024 * 5 // 5 MB
    }
});
const config = require('../../config');
const bluebird = require('bluebird');
const instance = require('../../models').instance;
const PilotImage = instance.model('PilotImage');
const passport = require('passport');
const common = require('./common');

const s3 = new AWS.S3({
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
    region: config.s3.region
});

function buildFileName(basename, suffix) {
    return basename + '_' + suffix + '.jpg';
}

function uploadS3(file, buffer, callback) {
    return new bluebird(function(resolve,reject) {
        s3.putObject({
            Bucket: config.s3.bucket,
            Key: file,
            Body: buffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
            CacheControl: 'max-age=31536000' // 1 year
        }, function (err) {
            if(err) return reject(err);
            resolve(file);
        });
    });
}

function processImage(image, basename, suffix, width, height) {
    return new bluebird(function(resolve, reject) {
        image.clone(function(err, clone) {
            if(err) return reject(err);

            clone.batch()
            .resize(width, height)
            .toBuffer('jpg', {quality: 80}, function(err, buffer) {
                if(err) return reject(err);
                uploadS3(buildFileName(basename, suffix), buffer)
                    .then(resolve).catch(reject);
            });
        });
    });
}

module.exports = function(app) {
    /**
     * @api {get} /pilot/:id/image Get Pilot Images
     * @apiName GetPilotIdImage
     * @apiGroup Pilot
     *
     * @apiError {String} status  "fail" / "error"
     * @apiError {Object} message Error Message
     *
     * @apiSuccess {String}     status       "success"
     * @apiSuccess {Object[]}   data         Image List
     * @apiSuccess {String}     data.id      Image ID
     * @apiSuccess {String}     data.small   Small Image URL (80x80)
     * @apiSuccess {String}     data.medium  Medium Image URL (400x400)
     */
    app.get('/pilot/:id/image', function(req, res) {
        PilotImage.findAll({
           where: {
               UploaderId: req.params.id
           }
       }).then(function(images) {
           res.json({
               status: 'success',
               data: images.map(image => {
                   return {
                       id: image.id,
                       small: config.s3.base + '/' + image.id + '_s.jpg',
                       medium: config.s3.base + '/' + image.id + '_m.jpg'
                   };
               })
           });
       }).catch(function(err) {
           res.status(500).json({
               status: 'error',
               message: err
           });
       });
    });

    /**
     * @api {post} /pilot/:id/image Upload Pilot Image
     * @apiName PostPilotIdImage
     * @apiGroup Pilot
     *
     * @apiPermission user
     *
     * @apiParam {File} file Image file, as multipart/form-data
     *
     * @apiSuccess {String} status "success"
     * @apiSuccess {Object} data Image
     * @apiSuccess {Number} data.id Image ID
     */
    app.post('/pilot/:id/image',
        passport.authenticate('bearer', {session: false}),
        upload.single('file'), function(req, res) {

        if(! (req.user && ('' + req.user.id) === ('' + req.params.id))) {
            return res.status(403).json({
                status: 'fail',
                message: 'No Permission'
            });
        }

        lwip.open(req.file.buffer, common.imageTypeFromFile(req.file), function(err, image) {
            if(err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Reading uploaded file failed'
                });
            }

            const basename = uuid.v4();
            const minSide = Math.min(image.width(), image.height());
            image.crop(minSide, minSide, function(err, image) {
                bluebird.all([
                    processImage(image, basename, 's', 80, 80),
                    processImage(image, basename, 'm', 400, 400)
                ]).then(function() {
                    return PilotImage.create({
                        id: basename,
                        UploaderId: req.user.id,
                    });
                }).then(function() {
                    res.json({
                        status: 'success',
                        data: {
                            id: basename
                        }
                    });
                });
            });
        });
    });
}
