const express = require('express')
const { config } = require('./config')
const passport = require('passport')
const boom = require('@hapi/boom')
const cookieParser = require('cookie-parser')
const axios = require('axios')

const app = express()

app.use(express.json())
app.use(cookieParser())

require('./utils/auth/strategies/basic')

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

app.listen(config.port, () => {
    console.log(`Listening on http://localhost:${config.port}`)
})