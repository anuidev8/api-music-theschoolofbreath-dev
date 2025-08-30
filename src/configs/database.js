const mongoose = require('mongoose');
const { mongoUri } = require('./vars');

if(process.env.NODE_ENV == 'development') {
    mongoose.set('debug', true);
}

const conn = mongoose.connect(`${mongoUri}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(db => console.log('Database is connected'))
.catch(err => { 
    console.error(err);
    console.log(err);
});