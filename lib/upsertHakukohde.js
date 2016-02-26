const config = require('../config')
const unirest = require('unirest')
const deferred = require('deferred')

function upsertHakukohde(casTicket, hakukohde) {
    const def = deferred()

    unirest.post(config.baseUrl + '/tarjonta-service/rest/v1/hakukohde')
        .headers({
            CasSecurityTicket: casTicket,
            'Content-Type': 'application/json; charset=UTF-8'
        })
        .send(hakukohde)
        .end(response => {
            def.resolve(response)
        })

    return def.promise
}

module.exports = upsertHakukohde