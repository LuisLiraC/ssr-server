const express = require('express')
const { config } = require('./config')
const passport = require('passport')
const boom = require('@hapi/boom')
const cookieParser = require('cookie-parser')
const axios = require('axios')
const helmet = require('helmet')

const app = express()

app.use(express.json())
app.use(helmet())
app.use(cookieParser())

require('./utils/auth/strategies/basic')
require('./utils/auth/strategies/oauth')
require('./utils/auth/strategies/facebook')

app.post('/auth/sign-in', async function (req, res, next) {
    passport.authenticate('basic', function (error, data) {
        try {
            if (error || !data) {
                next(boom.unauthorized())
            }

            req.login(data, { session: false }, async function (error) {
                if (error) {
                    next(error)
                }

                const { token, ...user } = data

                res.cookie('token', token, {
                    httpOnly: !config.dev,
                    secure: !config.dev
                })

                res.status(200).json(user)
            })
        } catch (err) {
            next(err)
        }
    })(req, res, next)
})

app.post('/auth/sign-up', async function (req, res, next) {
    const { body: user } = req

    try {
        await axios({
            url: `${config.apiUrl}/api/auth/sign-up`,
            method: 'post',
            data: user
        })

        res.status(201).json({
            message: 'user created'
        })
    } catch (err) {
        next(err)
    }
})

app.get('/movies', async function (req, res, next) {

})

app.post('/user-movies', async function (req, res, next) {
    try {
        const { body: userMovie } = req
        const { token } = req.cookies

        const { data, status } = await axios({
            url: `${config.apiUrl}/api/user-movies`,
            headers: { Authorization: `Bearer ${token}` },
            method: 'post',
            data: userMovie
        })

        if (status !== 201) {
            return next(boom.badImplementation())
        }

        res.status(201).json(data)

    } catch (err) {
        next(err)
    }
})

app.delete('/user-movies/:userMovieId', async function (req, res, next) {
    try {
        const { userMovieId } = req.params
        const { token } = req.cookies

        const { data, status } = await axios({
            url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
            headers: { Authorization: `Bearer ${token}` },
            method: 'delete'
        })

        if (status !== 200) {
            return next(boom.badImplementation())
        }

        res.status(200).json(data)

    } catch (err) {
        next(err)
    }
})


app.get('/auth/google-oauth', passport.authenticate('google-oauth', {
    scope: ['email', 'profile', 'openid']
}))

app.get('/auth/google-oauth/callback', passport.authenticate('google-oauth', { session: false }), function (req, res, next) {
    if (!req.user) {
        next(boom.unauthorized())
    }

    const { token, ...user } = req.user

    res.cookie('token', token, {
        httpOnly: !config.dev,
        secure: !config.dev
    })

    res.status(200).json(user)
})

app.get('/auth/facebook', passport.authenticate('facebook'))

app.get('/auth/facebook/callback', passport.authenticate('facebook', {session: false}), function(req, res, next){
    if(!req.user){
        next(boom.unauthorized())
    }

    const {token, ...user} = req.user

    res.cookie("token", token, {
        httpOnly: !config.dev,
        secure: !config.dev
    })

    res.status(200).json(user)
})




app.listen(config.port, () => {
    console.log(`Listening on http://localhost:${config.port}`)
})

