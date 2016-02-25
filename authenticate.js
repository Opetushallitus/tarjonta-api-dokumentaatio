const unirest = require('unirest')
const config = require('./config')
const deferred = require('deferred')

function authenticate() {
    const def = deferred()

    unirest.post(config.baseUrl + '/cas/v1/tickets')
        .send(config.credentials)
        .end(response => {
            const ticketGrantingTicket = response.headers.location

            unirest.post(ticketGrantingTicket)
                .send({
                    service: config.baseUrl + '/tarjonta-service/j_spring_cas_security_check'
                })
                .end(response => {
                    const serviceGrantingTicket = response.body
                    def.resolve(serviceGrantingTicket)
                })
        })

    return def.promise
}

module.exports = authenticate