
import { CLIENT_ID, API_KEY } from './secrets'
import { log } from './utils'

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://script.googleapis.com/$discovery/rest?version=v1",
];

const scopesArray = [
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/userinfo.email",
];
var SCOPES = " "; //scopesArray.join(' ')

const signIn = () => {
    gapi.auth2.getAuthInstance().signIn().then(updateSigninStatus);
};

function signOut () {
    const inst = gapi.auth2.getAuthInstance()
    console.log(inst)
    inst.signOut();
    window.location = '/'
}

export async function getUser () {
    return new Promise((resolve, reject) => {
        // window.gapi.load("client:auth2", () =>
        initClient(resolve, reject)
        // );
    });
}

async function initClient (resolve, reject) {
    const options = {
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
        fetch_basic_profile: true,
        prompt: "select_account",
    };
    const user = await gapi.client
        .init(options)
        .then(() => {
            const user = updateSigninStatus()
                .then((user) => resolve(user))
                .catch(reject);
        })
        .catch((e) => console.log("Error in initClient", { e }));
}

async function updateSigninStatus () {
    const buildUser = ({ profile, googleUser }) => {
        return {
            photoUrl: profile.getImageUrl(),
            displayName: profile.getName(),
            firstName: profile.getGivenName(),
            lastName: profile.getFamilyName(),
            email: profile.getEmail(),
            id: profile.getId(),
            idToken: googleUser.getAuthResponse().id_token,
            accessToken: googleUser.getAuthResponse().access_token,
            auth: true,
            hasPinAuth: false,
            hasFirebaseAuth: false,
            signout: signOut,
        };
    };
    const getProfile = () => {
        const googleAuth = gapi.auth2.getAuthInstance();
        const googleUser = googleAuth.currentUser.get();
        const profile = googleUser.getBasicProfile();
        return { profile, googleUser };
    };
    let { profile } = getProfile();
    while (!profile) {
        await gapi.auth2.getAuthInstance().signIn();
        profile = getProfile().profile;
    }
    return buildUser(getProfile());
}