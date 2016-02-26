const authenticate = require('./lib/authenticate')
const config = require('./config')
const unirest = require('unirest')
const assert = require('assert')
const upsertKoulutus = require('./lib/upsertKoulutus')
const upsertHakukohde = require('./lib/upsertHakukohde')

authenticate().then(casTicket => {

    const vapaaTekstiRakenne = {
        tekstis: {
            kieli_fi: '<p>Vapaa teksti...</p>',
            kieli_sv: '<p>Samma på svenska...</p>'
        }
    }

    // Luodaan uusi ammatillinen perustutkinto: Autoalan perustutkinto, autokorinkorjauksen osaamisala
    const koulutus = {
        tila: 'LUONNOS',
        organisaatio: {
            oid: config.organisationOid
        },
        toteutustyyppi: 'AMMATILLINEN_PERUSTUTKINTO',
        koulutuksenAlkamisPvms: [
            new Date().getTime() // koulutuksen aklamispvmt, voi olla useita
        ],
        koulutuskoodi: { // Koulutus koodistosta: https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/koulutus/5
            uri: 'koulutus_351301' // Autoalan perustutkinto
        },
        koulutusohjelma: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/osaamisala/3
            uri: 'osaamisala_1525' // autokorinkorjauksen osaamisala
        },
        linkkiOpetussuunnitelmaan: 'http://linkkiOpetusSuunnitelmaan.com',
        pohjakoulutusvaatimus: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/pohjakoulutusvaatimustoinenaste/1
            uri: 'pohjakoulutusvaatimustoinenaste_pk' // peruskoulu
        },
        ammattinimikkeet: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/ammattiluokitus/1
            uris: {
                ammattiluokitus_00425: 1
            }
        },
        kuvausKomoto: {
            KANSAINVALISTYMINEN: vapaaTekstiRakenne,
            KOULUTUSOHJELMAN_VALINTA: vapaaTekstiRakenne,
            SIJOITTUMINEN_TYOELAMAAN: vapaaTekstiRakenne,
            SISALTO: vapaaTekstiRakenne,
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
                kieli_fi: 1 // opetetaan suomeksi
            }
        },
        opintojenLaajuusarvo: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opintojenlaajuus/1
            uri: 'opintojenlaajuus_180' // 180
        },
        opintojenLaajuusyksikko: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opintojenlaajuusyksikko/1
            uri: 'opintojenlaajuusyksikko_6' // osaamispistettä
        },
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

            // Lisätään hakukohde
            const hakukohde = {
                tila: 'LUONNOS',
                hakuOid: '1.2.246.562.29.80306203979',
                koulutukset: [
                    {
                        oid: koulutusDelta.oid
                    }
                ],
                aloituspaikatLkm: 10,
                valintojenAloituspaikatLkm: 11,
                hakukohteenLiitteet: [
                    {
                        kieliUri: 'kieli_fi',
                        // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/liitetyypitamm/1
                        liitteenTyyppi: 'liitetyypitamm_4#1', // lausunnot
                        liitteenKuvaukset: {
                            kieli_fi: '<p>vapaa teksti</p>'
                        },
                        liitteenToimitusOsoite: {
                            osoiterivi1: 'InfoOmnia, PL 77710',
                            postinumero: 'posti_02070',
                            postitoimipaikka: 'ESPOON KAUPUNKI'
                        },
                        toimitettavaMennessa: new Date().getTime()
                    }
                ],
                // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/hakukohteet/3
                hakukohteenNimiUri: 'hakukohteet_859#3', // ajoneuvo ja kuljetustekniikka,
                kaksoisTutkinto: true, // Mahdollisuus suorittaa ammatillisen perustutkinnon rinnalla lukio ja/tai ylioppilastutkinto
                lisatiedot: {
                    kieli_fi: '<p>vapaa teksti</p>'
                },
                valintakokeet: [
                    {
                        kieliUri: 'kieli_fi',
                        // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/valintakokeentyyppi/1
                        valintakoetyyppi: 'valintakokeentyyppi_2#1', // lisänäyttö
                        valintakokeenKuvaus: {
                            teksti: '<p>vapaa teksti</p>',
                            uri: 'kieli_fi'
                        }
                    }
                ]
            }

            upsertHakukohde(casTicket, hakukohde).then(response => {
                assert.equal('OK', response.body.status)

                // Muokataan hakukohdetta
                const hakukohdeDelta = {
                    oid: response.body.result.oid,
                    valintojenAloituspaikatLkm: 15
                }
                upsertHakukohde(casTicket, hakukohdeDelta).then(response => {
                    assert.equal('OK', response.body.status)
                    assert.equal(hakukohdeDelta.valintojenAloituspaikatLkm, response.body.result.valintojenAloituspaikatLkm)
                })
            })

        })
    })

})
