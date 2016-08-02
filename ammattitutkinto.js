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

    // Luodaan uusi koulutus "Myynnin ammattitutkinto" (koulutukseen sisältyy valmistava koulutus)
    const koulutus = {
        tila: 'LUONNOS',
        organisaatio: {
            oid: config.organisationOid
        },
        jarjestavaOrganisaatio: {
            oid: '1.2.246.562.10.72984508936' // Näyttötutkinnon järjestäjän oid
        },
        toteutustyyppi: 'AMMATTITUTKINTO',
        opintojenMaksullisuus: true, // jos koulutus on maksullinen
        hintaString: '120', // koulutuksen hinta jos maksullinen,
        koulutuksenAlkamisPvms: [
            new Date().getTime() // koulutuksen aklamispvmt, voi olla useita
        ],
        koulutuskoodi: { // Koulutus koodistosta:
            uri: 'koulutus_334105' // Myynnin ammattitutkinto
        },
        kuvausKomo: {
            JATKOOPINTO_MAHDOLLISUUDET: vapaaTekstiRakenne,
            KOULUTUKSEN_RAKENNE: vapaaTekstiRakenne,
            TAVOITTEET: vapaaTekstiRakenne
        },
        kuvausKomoto: {
            MAKSULLISUUS: vapaaTekstiRakenne,
            OSAAMISALAN_VALINTA: vapaaTekstiRakenne,
            SIJOITTUMINEN_TYOELAMAAN: vapaaTekstiRakenne,
            NAYTTOTUTKINNON_SUORITTAMINEN: vapaaTekstiRakenne,
            YHTEISTYO_MUIDEN_TOIMIJOIDEN_KANSSA: vapaaTekstiRakenne
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
        yhteyshenkilos: [
            {
                henkiloTyyppi: 'YHTEYSHENKILO',
                nimi: 'Matti Meikäläinen',
                puhelin: '0325094392023',
                sahkoposti: 'matti@meikalainen.com',
                titteli: 'Opinto-ohjaaja'
            }
        ],

        // Jos koulutukseen sisältyy valmistava koulutus
        valmistavaKoulutus: {
            opintojenMaksullisuus: true, // jos valmistava koulutus on maksullinen
            hintaString: '220', // valmistavan koulutuksen hinta
            linkkiOpetussuunnitelmaan: 'http://linkki-opetussuunnitelmaan.com',
            kuvaus: {
                KANSAINVALISTYMINEN: vapaaTekstiRakenne,
                KOHDERYHMA: vapaaTekstiRakenne,
                OPISKELUN_HENKILOKOHTAISTAMINEN: vapaaTekstiRakenne,
                SISALTO: vapaaTekstiRakenne
            },
            suunniteltuKestoArvo: '3',
            suunniteltuKestoTyyppi: { // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/suunniteltukesto/1
                uri: 'suunniteltukesto_01' // vuotta
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
    }

    upsertKoulutus(casTicket, koulutus).then(response => {
        assert.equal('OK', response.body.status)

        const koulutusOid = response.body.result.oid

        // Liitetään koulutus hakuun lisäämällä sille hakukohde
        // Huom! Haku luodaan tarjonnan käyttöliittymän kautta ja sieltä voi poimia tunnisteen talteen!
        const hakuOid = '1.2.246.562.29.73707436306'

        const hakukohde = {
            hakuOid: hakuOid,
            tila: 'LUONNOS',
            koulutukset: [ // hakukohteeseen liitettävät koulutukset
                {
                    oid: koulutusOid // voi viitata Opintopolun sisäisellä tunnisteella
                                     // tai vaihtoehtoisesti {uniqueExternalId: 'korkeakoulun oma tunniste'}
                }
            ],
            hakukohteenNimiUri: 'aikuhakukohteet_4064#4', // Myynnin ammattitutkinto, aikuhakukohteet-koodistosta
            aloituspaikatLkm: 15,
            hakukohteenLiitteet: [
                {
                    kieliUri: 'kieli_fi',
                    liitteenKuvaukset: {
                        kieli_fi: '<p>vapaa teksti</p>'
                    },
                    liitteenNimi: 'Testiliite',
                    liitteenToimitusOsoite: {
                        osoiterivi1: 'PL 11110',
                        postinumero: 'posti_00076',
                        postitoimipaikka: 'AALTO'
                    },
                    toimitettavaMennessa: new Date().getTime()
                }
            ],
            lisatiedot: {
                kieli_fi: '<p>Vapaa teksti</p>'
            },
            valintaperusteKuvaukset: {
                kieli_fi: '<p>vapaa teksti</p>'
            },
            valintakokeet: [
                {
                    kieliUri: 'kieli_fi',
                    valintakoeAjankohtas: [
                        {
                            alkaa: new Date().getTime(),
                            loppuu: new Date().getTime(),
                            osoite: {
                                osoiterivi1: 'Testikatu',
                                postinumero: 'posti_00350',
                                postitoimipaikka: 'HELSINKI'
                            }
                        }
                    ],
                    valintakoeNimi: 'Testivalintakoe',
                    valintakokeenKuvaus: {
                        uri: 'kieli_fi',
                        teksti: '<p>Valintakokeen kuvaus</p>'
                    },
                    teksti: '<p>Valintakokeen kuvaus</p>'
                }
            ]
        }

        upsertHakukohde(casTicket, hakukohde).then(response => {
            assert.equal('OK', response.body.status)

            // muokataan tallennettua hakukohdetta
            const hakukohdeDelta = {
                oid: response.body.result.oid,
                lisatiedot: {
                    kieli_fi: '<p>Muokattu teksti..</p>'
                }
            }
            upsertHakukohde(casTicket, hakukohdeDelta).then(response => {
                assert.equal('OK', response.body.status)
                assert.deepEqual(hakukohdeDelta.lisatiedot, response.body.result.lisatiedot)
            })
        })
    })

})
