const mongoose = require('mongoose')



if(process.env.NODE_ENV == 'development') {
    mongoose.set('debug', true)
}

mongoose.connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
   
})

.then(db => console.info('Database is connected'))
.catch(err => console.error(err))