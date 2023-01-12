const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');


const AWS = require('aws-sdk');

// Configure the SDK with AWS credentials
// AWS.config.update({
//     accessKeyId: '',
//     secretAccessKey: '',
//     region: 'ap-south-1'
// });
AWS.config.update({region: 'ap-south-1'});
// s3 config /Create a new S3 object
const s3 = new AWS.S3();
// Create a new SES object
const ses = new AWS.SES();
// template engine
app.set('view engine', 'ejs');

// body-parser to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.render('index')
})
app.get('/create', (req, res) => {
    res.render('create')
})
app.get('/ses', (req, res) => {
    res.render('form');
});

// function for uploading file
async function uploadFile(file) {
    const params = {
        Bucket: "saikumar-files",
        Key: `uploads-${Date.now()}-${file.name}`,
        Body: file.data,
        ACL: "public-read",
    };
    const data = await s3.upload(params).promise();
    return data.Location; // returns the url location
}
// upload file to bucket
app.post("/upload", async (req, res) => {
    try {
        console.log('req.files', req.files)
        const fileLocation = await uploadFile(req.files.uFile);
        console.log(fileLocation)
        res.redirect('/')
    } catch (error) {
        console.log(error)
        res.send('Error uploading file')
    }
});
// create a bucket
app.post("/create", async (req, res) => {
    console.log('req', req.body.bucket)
    try {
        const bucketName = req.body.bucket
        var bucketParams = {
            Bucket: bucketName
        };
        s3.createBucket(bucketParams, function (err, data) {
            if (err) {
                console.log("Error", err);
                res.send('Error creating bucket ' + err)

            } else {
                console.log("Success", data);
                res.redirect("/")
            }
        });
    } catch (error) {
        console.log(error)
        res.send('Error creating bucket ' + error)

    }
})

app.post('/submit-form', (req, res) => {
    const { name, email } = req.body;
    console.log(`Name: ${name}, Email: ${email}`);
    try {
        //prepare email to send
        const params = {
            Source: "test@test.com",
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: { Data: "From: " + "test@test.com" },
                Body: {
                    Text: { Data: "Hi " + name  }
                },
            },
        };

        const emailSent = ses.sendEmail(params).promise();
        emailSent
            .then((data) => {
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (error) {
        console.log(error);
    }
    res.send('Form submitted');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
