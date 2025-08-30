const { Schema, model } = require('mongoose')
const bcrypt = require('bcryptjs')
const hashPassword = require('../utils/hasPassword')
const mongoosePaginate = require('mongoose-paginate-v2');
const moment = require('moment');
const jwt = require('jsonwebtoken')
const { jwtSecret, img, clientUrl } = require('../configs/vars')
const { v4: uuidv4 } = require('uuid');
const generateCode = require('../utils/generateCode')

const User = new Schema({
    email: {
        type: String,
        required: true,
        uniqued: true
    },
    fullName: {
        type: String,
        default: "usuario"
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', "branch", "partner"]
    },

    password: {
        type: String,
        required: true
    },
    securityToken: {
        type: String,
        default: null
    },
    suscription: {
        type: Boolean,
        default: false
    },
    isStartSubscription:{
        type:Boolean,
        default:false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})
//dias de la promocion
User.virtual("promotionDays");

User.post(["findOne", "findById"], async function (result) {
    try {
        const createdAt = moment(result.createdAt);
        const now = moment();
        const diff = now.diff(createdAt, 'days');
       
        if (diff > 7) {
            result.set("promotionDays", diff)
            // La fecha createdAt es mayor a 7 días respecto a la fecha actual
            // Realiza la lógica necesaria aquí
        } else {
            result.set("promotionDays", diff)
        }
    } catch (error) { }
});
User.methods = {

    token() {
        const payload = {
            // exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
            //   iat: moment().unix(),
            sub: this._id,
        };
        return jwt.sign(payload, jwtSecret);
    },
    passwordMatches(password) {
        return bcrypt.compare(password, this.password);
    }

}

User.statics = {
    async findAndGenerateToken(options) {
        const { email, password } = options;
        if (!email && !password) return null;
        let user = null
        if (email)
            user = await this.findOne({ email }, { _v: 0 })

        if (password) {
            if (user && await user.passwordMatches(password)) {
                return { success: true, user, token: user.token() };
            }
            
        }
        return {info:'Password or email incorrect'}
    },
}

User.pre('save', async function save(next) {
    try {
        if (this.isNew) {
            const hash = hashPassword(this.password)
            this.password = hash;


        }
        return next();
    } catch (error) {
        return next(error);
    }
});


User.plugin(mongoosePaginate);


module.exports = model('User', User)