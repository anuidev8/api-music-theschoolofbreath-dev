const bcrypt = require('bcryptjs')


module.exports = (password)=>{
    const rounds = process.env.NODE_ENV === 'development' ? 1 : 10;
    return  bcrypt.hashSync(password, bcrypt.genSaltSync(rounds))
}