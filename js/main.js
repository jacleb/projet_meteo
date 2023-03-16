import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

const DOMAINE = "http://api.openweathermap.org/"

const page = ref("accueil")
const erreur = ref(false)
const ville = ref("")
const pays = ref("")
const api_cle = "73841a422a8ebe8f986ceaabfe25175f"

const neige = ref(false)
const pluie = ref(false)

// Objet pour encapsuler les informations reçues de l'API
const meteo = ref({
    endroit_recherche: "",
    temperature: 0,
    temperature_ressentie: 0,
    description: "",
    vent: "",
    lever_du_soleil: "",
    coucher_du_soleil: "",
    fuseau_horaire: 0,
    quantite_neige: 0,
    quantite_pluie: 0,
    url_icone: "",
})

// Envoie la ville et le pays inscritent dans le formulaire et vérifie s'ils existent dans l'API
function envoyerInformations() {
    const url_resultat = DOMAINE + "geo/1.0/direct?q=" + ville.value + "," + pays.value + "&limit=1&appid=" + api_cle

    fetch(url_resultat).then(resp => resp.json()).then(data_location => {

        // Valide si l'information envoyée existe dans l'API. 
        // Un code "400" (paramètre interne de l'API) correspond à une recherche sans résultat avec un message "Nothing to geocode"
        if (data_location.cod == "400" || data_location.length == 0) {
            erreur.value = true
            return
        } else {
            ville.value = ""
            pays.value = ""
        }

        // URL avec les paramètres GET nécessaires pour accéder aux informations requises
        const url_meteo = DOMAINE + "data/2.5/weather?lat=" + data_location[0].lat + "&lon=" + data_location[0].lon + "&appid=" + api_cle + "&units=metric&lang=fr"

        fetch(url_meteo).then(resp => resp.json()).then(data_meteo => {
            page.value = 'meteo'

            // ENDROIT RECHERCHÉ ----------------------

            meteo.value.endroit_recherche = data_meteo.name + " (" + data_meteo.sys.country + ")"


            // TEMPÉRATURE ----------------------------

            meteo.value.temperature = data_meteo.main.temp


            // TEMPÉRATURE RESSENTI -------------------

            meteo.value.temperature_ressentie = data_meteo.main.feels_like


            // ICÔNE ----------------------------------

            meteo.value.url_icone = "http://openweathermap.org/img/wn/" + data_meteo.weather[0].icon + "@2x.png"


            // CONDITION ------------------------------

            const condition = data_meteo.weather[0].description
            // Affiche la première lettre du texte en majuscule et le reste en minuscule
            meteo.value.description = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase()


            // VENT -----------------------------------

            const degre = data_meteo.wind.deg

            // Calcul pour la vitesse du vent avec une conversion de m/s à km/h (*3.6). 
            // Arrondi la vitesse.
            meteo.value.vent = Math.round(data_meteo.wind.speed * 3.6)

            // Détermine la direction du vent selon les degrés fournis par l'API
            if (degre < 46 || degre > 316) {
                meteo.value.vent += "km/h du nord"
            } else if (degre > 45 || degre < 136) {
                meteo.value.vent += "km/h de l'est"
            } else if (degre > 135 || degre < 226) {
                meteo.value.vent += "km/h du sud"
            } else if (degre > 225 || degre < 316) {
                meteo.value.vent += "km/h de l'ouest"
            }


            // LEVER ET COUCHER DU SOLEIL ---------------------------------

            // Création d'un nouveau objet de date avec un calul pour convertir les secondes en milisecondes
            // Ajuster à l'heure locale avec le format demandé
            let heure_matin = new Date(data_meteo.sys.sunrise * 1000)
            meteo.value.lever_du_soleil = heure_matin.toLocaleTimeString("fr-CA", { hour: 'numeric', minute: '2-digit' })

            // Création d'un nouveau objet de date avec un calul pour convertir les secondes en milisecondes
            // Ajuster à l'heure locale avec le format demandé
            let heure_soiree = new Date(data_meteo.sys.sunset * 1000)
            meteo.value.coucher_du_soleil = heure_soiree.toLocaleTimeString("fr-CA", { hour: 'numeric', minute: '2-digit' })


            // FUSEAU HORAIRE -------------------------

            // Calcul pour convertir le timezone (reçu en secondes) en heures. 
            meteo.value.fuseau_horaire = data_meteo.timezone / 3600


            // NEIGE/PLUIE ----------------------------

            // Condition s'il neige ou pleut et encapsule les mm de ceux-ci si c'est le cas
            if (data_meteo.snow) {
                neige.value = true
                meteo.value.quantite_neige = data_meteo.snow["1h"]

            } else if (data_meteo.rain) {
                pluie.value = true
                meteo.value.quantite_pluie = data_meteo.rain["1h"]
            }
        })
    })
}

// Changer la page (bouton retour)
function changerPage() {
    page.value = "accueil"
    neige.value = false
    pluie.value = false
}

const root = {
    setup() {
        return {
            //Propriétés
            page,
            erreur,
            ville,
            pays,
            meteo,
            neige,
            pluie,

            //Méthodes
            envoyerInformations,
            changerPage,
        }
    }
}

//Initialisation de vue
createApp(root).mount('#app')