const authenticate = require('./authenticate')
const config = require('./config')
const unirest = require('unirest')
const assert = require('assert')
const upsertKoulutus = require('./upsertKoulutus')

authenticate().then(casTicket => {

    const vapaaTekstiRakenne = {
        tekstis: {
            kieli_fi: '<p>Vapaa teksti...</p>',
            kieli_sv: '<p>Samma på svenska...</p>'
        }
    }

    // Luodaan uusi korkeakoulutus "Hum. kand., historia"
    const koulutus = {
        tila: 'LUONNOS',
        organisaatio: {
            oid: config.organisationOid
        },
        toteutustyyppi: 'KORKEAKOULUTUS',
        aihees: { // Aiheet koodistosta: https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/aiheet/1
            uris: {
                aiheet_12: 1, // antropologia
                aiheet_15: 1 // filosofia
            }
        },
        opintojenMaksullisuus: true, // jos koulutus on maksullinen
        hintaString: '120', // koulutuksen hinta jos maksullinen,
        koulutuksenAlkamisPvms: [
            new Date().getTime() // koulutuksen aklamispvmt, voi olla useita
        ],
        koulutuskoodi: { // Koulutus koodistosta:
            uri: 'koulutus_623301' // Hum. kand., historia
        },
        koulutusohjelma: {
            tekstis: {
                kieli_fi: 'Humanististen tieteiden kandidaatti' // koulutukselle näytettävä nimi
            }
        },
        kuvausKomo: {
            JATKOOPINTO_MAHDOLLISUUDET: vapaaTekstiRakenne,
            KOULUTUKSEN_RAKENNE: vapaaTekstiRakenne,
            PATEVYYS: vapaaTekstiRakenne,
            TAVOITTEET: vapaaTekstiRakenne
        },
        kuvausKomoto: {
            KANSAINVALISTYMINEN: vapaaTekstiRakenne,
            LISATIETOA_OPETUSKIELISTA: vapaaTekstiRakenne,
            LOPPUKOEVAATIMUKSET: vapaaTekstiRakenne,
            MAKSULLISUUS: vapaaTekstiRakenne,
            PAAAINEEN_VALINTA: vapaaTekstiRakenne,
            SIJOITTUMINEN_TYOELAMAAN: vapaaTekstiRakenne,
            SISALTO: vapaaTekstiRakenne,
            TUTKIMUKSEN_PAINOPISTEET: vapaaTekstiRakenne,
            YHTEISTYO_MUIDEN_TOIMIJOIDEN_KANSSA: vapaaTekstiRakenne
        },
        opetusAikas: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opetusaikakk/1
            uris: {
                opetusaikakk_2: 1 // iltaopetus (avain on koodi_uri, arvo koodin versio)
            }
        },
        opetusPaikkas: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opetuspaikkakk/1
            uris: {
                opetuspaikkakk_2: 1 // etäopetus
            }
        },
        opetusmuodos: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opetusmuotokk/1
            uris: {
                opetusmuotokk_2: 1 // itsenäinen opiskelu
            }
        },
        opetuskielis: {
            uris: {
                kieli_fi: 1, // opetetaan suomeksi
                kieli_en: 1 // .. ja englanniksi
            }
        },
        opintojenLaajuusarvo: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opintojenlaajuus/1
            uri: 'opintojenlaajuus_180' // 180
        },
        opintojenLaajuusyksikko: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opintojenlaajuusyksikko/1
            uri: 'opintojenlaajuusyksikko_2' // opintopistettä
        },
        oppiaineet: [ // Koulutuksen "tägit" / hakusanat
            {
                kieliKoodi: 'kieli_fi',
                oppiaine: 'humanistinen ala'
            }
        ],
        suunniteltuKestoArvo: '3',
        suunniteltuKestoTyyppi: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/suunniteltukesto/1
            uri: 'suunniteltukesto_01' // vuotta
        },
        yhteyshenkilos: [
            {
                henkiloTyyppi: 'YHTEYSHENKILO',
                nimi: 'Matti Meikäläinen',
                puhelin: '0325094392023',
                sahkoposti: 'matti@meikalainen.com',
                titteli: 'Opinto-ohjaaja'
            }
        ]
    }

    upsertKoulutus(casTicket, koulutus).then(response => {
        assert.equal('OK', response.body.status)

        // Muokataan tallennettua koulutusta
        const koulutusDelta = {
            oid: response.body.result.oid, // koulutuksen tunniste
            toteutustyyppi: koulutus.toteutustyyppi, // toteutustyyppi on aina pakollinen kenttä!
            suunniteltuKestoArvo: '4'
        }
        upsertKoulutus(casTicket, koulutusDelta).then(response => {
            assert.equal('OK', response.body.status)
            assert.equal(koulutusDelta.suunniteltuKestoArvo, response.body.result.suunniteltuKestoArvo)
        })
    })

})
