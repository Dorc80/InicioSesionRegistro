const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'codingdojorocks' }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost/usuarios', { useNewUrlParser: true });

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'email required'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'email invalid']
    },
    name: {
        type: String,
        required: [true, 'name required']
    },
    lastName: {
        type: String,
        required: [true, 'lastName required']
    },
    password: {
        type: String,
        required: [true, 'password required']
    },
    birthday: {
        type: String,
        required: [true, 'birthday required']
    }

}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

app.post('/login', async (req, resp) => {

    try {

        console.log('req.body', req.body);

        const { email, password } = req.body;

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            throw new Error('email invalid');
        }

        const user = await User.findOne({ email: email });

        if (!user) {
            resp.render('login', { error: 'user not found' })
        } else {

            let isValidPassword = await bcrypt.compare(password, user.password);

            if (isValidPassword) {
                req.session.loginOk = true;
                resp.redirect('/');
            } else {
                resp.render('login', { error: 'password error' });
            }

        }

    } catch (error) {
        resp.render('login', { error: handleError(error) });
    }

});

app.get('/login', (req, resp) => {
    resp.render('login');
});

app.get('/', (req, resp) => {

    console.log('loginOk', req.session.loginOk);

    if (req.session.loginOk) {
        resp.render('index');
    } else {
        resp.redirect('/login');
    }

});

app.post('/register', async (req, resp) => {

    try {

        console.log('req.body', req.body);

        const { email, password, name, lastName, birthday } = req.body;

        let passwordEncrypt = await bcrypt.hash(password, 10);

        const user = new User();
        user.email = email;
        user.password = passwordEncrypt;
        user.name = name;
        user.lastName = lastName;
        user.birthday = birthday;

        user.save()
            .then(user => {
                resp.redirect('/login');
            })
            .catch(error => {
                resp.render('register', { error: handleError(error) });
            });

    } catch (error) {
        console.log('error', handleError(error));
        resp.end();
    }


});

app.get('/register', (req, resp) => {
    resp.render('register', { error: '' });
});

app.get('*', (req, resp) => {
    resp.render('404');
});

function handleError(error) {

    if (error?.code == 11000) {
        return `Email duplicate ${error.keyValue.email}`;
    } else if (error.errors?.email?.path == 'email') {
        return error.errors?.email?.properties?.message;
    } else if (error.message) {
        return error.message;
    }

    return error;

}

app.listen(8000, () => {
    console.log('Listening on 8000');
})