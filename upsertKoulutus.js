const config = require('./config')
const unirest = require('unirest')
const deferred = require('deferred')

function upsertKoulutus(casTicket, koulutus) {
    const def = deferred()

    unirest.post(config.baseUrl + '/tarjonta-service/rest/v1/koulutus')
        .headers({
            CasSecurityTicket: casTicket,
            'Content-Type': 'application/json; charset=UTF-8'
        })
        .send(koulutus)
        .end(response => {
            def.resolve(response)
        })

    return def.promise
}

module.exports = upsertKoulutus