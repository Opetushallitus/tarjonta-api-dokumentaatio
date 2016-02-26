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

    // Luodaan uusi korkeakouluopinto opintokokonaisuus
    const koulutus = {
        tila: 'LUONNOS',
        organisaatio: {
            oid: config.organisationOid
        },
        opetusJarjestajat: [ // Organisaatiot jotka saavat järjestää koulutusta
            '1.2.246.562.10.78305677532'
        ],
        koulutusmoduuliTyyppi: 'OPINTOKOKONAISUUS',
        toteutustyyppi: 'KORKEAKOULUOPINTO',
        hakijalleNaytettavaTunniste: 'hakijalle näytettävä tunniste',
        opettaja: 'Olli Opettaja',
        aihees: { // Aiheet koodistosta: https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/aiheet/1
            uris: {
                aiheet_12: 1, // antropologia
                aiheet_15: 1 // filosofia
            }
        },
        // https://testi.virkailija.opintopolku.fi/koodisto-service/rest/codeelement/codes/opinnontyyppi/1
        opinnonTyyppiUri: 'opinnontyyppi_5',
        opintojenMaksullisuus: true, // jos koulutus on maksullinen
        hintaString: '120', // koulutuksen hinta jos maksullinen,
        koulutuksenAlkamisPvms: [
            new Date().getTime() // koulutuksen aklamispvmt, voi olla useita
        ],
        koulutuksenLoppumisPvm: new Date().getTime(),
        koulutusohjelma: {
            tekstis: {
                kieli_fi: 'Testikokonaisuus' // koulutukselle näytettävä nimi
            }
        },
        kuvausKomo: {
            TAVOITTEET: vapaaTekstiRakenne
        },
        kuvausKomoto: {
            ARVIOINTIKRITEERIT: vapaaTekstiRakenne,
            EDELTAVAT_OPINNOT: vapaaTekstiRakenne,
            KOHDERYHMA: vapaaTekstiRakenne,
            LISATIEDOT: vapaaTekstiRakenne,
            MAKSULLISUUS: vapaaTekstiRakenne,
            OPETUKSEN_AIKA_JA_PAIKKA: vapaaTekstiRakenne,
            SISALTO: vapaaTekstiRakenne
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
        opintojenLaajuusPistetta: '120',
        oppiaineet: [ // Koulutuksen "tägit" / hakusanat
            {
                kieliKoodi: 'kieli_fi',
                oppiaine: 'testikokonaisuus'
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
        ]
    }

    upsertKoulutus(casTicket, koulutus).then(response => {
        assert.equal('OK', response.body.status)

        // Muokataan tallennettua koulutusta
        const koulutusDelta = {
            oid: response.body.result.oid, // koulutuksen tunniste
            toteutustyyppi: koulutus.toteutustyyppi, // toteutustyyppi on aina pakollinen kenttä!
            koulutusohjelma: {
                tekstis: {
                    kieli_fi: 'Testikokonaisuus modified'
                }
            }
        }

        upsertKoulutus(casTicket, koulutusDelta).then(response => {
            assert.equal('OK', response.body.status)
            assert.deepEqual(koulutusDelta.koulutusohjelma.tekstis, response.body.result.koulutusohjelma.tekstis)

            // Lisätätään opintokokonaisuudelle opintojakso
            const opintojakso = Object.assign({}, koulutus, {
                koulutusmoduuliTyyppi: 'OPINTOJAKSO',
                koulutusohjelma: {
                    tekstis: {
                        kieli_fi: 'Testijakso'
                    }
                },
                sisaltyyKoulutuksiin: [
                    {
                        oid: koulutusDelta.oid
                    }
                ]
            })
            upsertKoulutus(casTicket, opintojakso).then(response => {
                assert.equal('OK', response.body.status)
            })

            // Lisätään hakukohde opintokokonaisuudelle
            // hakukohde linkittyy automaattisesti opintojaksoon kokonaisuuden kautta
            const hakukohde = {
                tila: 'LUONNOS',
                hakuOid: '1.2.246.562.29.458950780910',
                hakuMenettelyKuvaukset: {
                    kieli_fi: '<p>vapaa teksti</p>'
                },
                koulutukset: [
                    {
                        oid: koulutusDelta.oid
                    }
                ],
                hakukohteenNimet: {
                    kieli_fi: 'Testihakukohde'
                },
                lisatiedot: {
                    kieli_fi: '<p>vapaa teksti</p>'
                },
                peruutusEhdotKuvaukset: {
                    kieli_fi: '<p>vapaa teksti</p>'
                }
            }

            upsertHakukohde(casTicket, hakukohde).then(response => {
                assert.equal('OK', response.body.status)

                // Muokataan hakukohdetta
                const hakukohdeDelta = {
                    oid: response.body.result.oid,
                    hakukohteenNimet: {
                        kieli_fi: 'Testihakukohde muokattu'
                    }
                }
                upsertHakukohde(casTicket, hakukohdeDelta).then(response => {
                    assert.equal('OK', response.body.status)
                })
            })

        })

    })

})
