/**
 * @overview ccmjs-based web component for a data-cloud user.
 * @author André Kless <andre.kless@web.de> 2023
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 * @changes
 * version 1.0.0 (03.05.2023)
 */

( () => {
  const component = {
    name: 'cloud_user',
    ccm: './libs/ccm/ccm.js',
    config: {
      "html": [ "ccm.load", "./resources/templates.html" ],
      "css": [ "ccm.load",
        [
          "./libs/bootstrap/css/bootstrap.css",
          "./resources/styles.css"
        ]
      ],
      "libs": [ "ccm.load", "./libs/bootstrap/js/bootstrap.bundle.js" ],
      "helper": [ "ccm.load", "./libs/ccm/helper.mjs" ],
      "hash": [ "ccm.load", "./libs/md5/md5.mjs#md5" ],
      "store": [ "ccm.store", { "url": "https://ccm2.inf.h-brs.de", "name": "dms-user" } ],
      "realm": "cloud",
      "convert": { "name2key": username => username },
      "picture": "./resources/user.svg",
      "text": {
        "username": "Username",
        "realname": "Realname",
        "password": "Password",
        "picture": "Picture URL",
        "login_form": "Login Form",
        "register_form": "Register Form",
        "profile_form": "Edit Profile",
        "login_btn": "Login",
        "logout_btn": "Logout",
        "register_btn": "Register",
        "profile_btn": "Save",
        "change_pw_btn": "Change Password",
        "delete_btn": "Delete Account",
        "cancel_btn": "Cancel"
      }
    },
    Instance: function () {

      let $;
      let data = null;

      this.init = async () => {
        $ = Object.assign( {}, this.ccm.helper, this.helper );
        $.use( this.ccm );
      };

      this.start = async () => {
        $.setContent( this.element, $.html( this.html.main, {
          user: this.getUsername(),
          picture_url: data ? data?.picture || this.picture : '',
          loginLogoutCaption: data ? this.text.logout_btn : this.text.login_btn,
          ...this.text,
          onClickLoginLogout: () => {
            if ( data ) return this.logout();
            const cache = sessionStorage.getItem( 'ccm-user-cloud' );
            if ( cache ) {
              data = JSON.parse( cache );
              this.start();
            }
            else
              this.showLoginDialog();
          },
          onClickRegister: () => {
            closeDialog( 'login' );
            this.showRegisterDialog();
          },
          onClickProfile: () => this.showProfileDialog(),
          onSubmitLogin: event => onSubmitForm( event, 'login' ),
          onSubmitRegister: event => onSubmitForm( event, 'register' ),
          onCancelLogin: () => closeDialog( 'login' ),
          onCancelRegister: () => closeDialog( 'register' ),
          onCancelProfile: () => closeDialog( 'profile' )
        } ) );
      };

      this.showRegisterDialog = () => showDialog( 'register' );

      this.showLoginDialog = () => showDialog( 'login' );

      this.showProfileDialog = () => {
        showDialog( 'profile' );
        $.fillForm( this.element.querySelector( '#profile-form' ), data );
      }

      this.register = async ( username, password ) => {
        const { url, name } = this.store.source();
        data = await this.ccm.load( {
          url: url + '/register/',
          params: {
            username: this.convert.name2key( username ),
            password,
            store: name,
            realm: this.realm
          }
        } );
        await this.start();
      };

      /**
       * logs an user in if not already logged in
       * @params {string} [username] only needed if user is not already logged in
       * @params {string} [password=''] default: empty password
       * @returns {Promise<void>}
       */
      this.login = async ( username, password = '' ) => {
        if ( data ) return;
        const { url, name } = this.store.source();
        data = await this.ccm.load( {
          url: url,// + '/login/',
          params: {
//          username,
//          password,
            store: name,
            realm: this.realm,
            user: this.convert.name2key( username ),
            token: this.hash ? this.hash( password ) : password
          }
        } );
        sessionStorage.setItem( 'ccm-user-cloud', JSON.stringify( data ) );
        await this.start();
      };

      /**
       * logs the user out
       * @returns {Promise<void>}
       */
      this.logout = async () => {
        if ( !data ) return;
        /*
        await this.ccm.load( {
          url: this.store.source().url + '/logout/',
          params: { token: data.token }
        } );
         */
        data = null;
        sessionStorage.removeItem( 'ccm-user-cloud' );
        await this.start();
      };

      /**
       * checks if an user is logged in
       * @returns {boolean}
       */
      this.isLoggedIn = () => !!data;

      /**
       * returns displayed username
       * @returns {string}
       */
      this.getUsername = () => {
        const user = $.clone( this.getValue() );
        if ( !data ) return '';
        return user.name || user.user || user.key;
      };

      /**
       * returns authentication mode
       * @returns {string}
       */
      this.getRealm = () => this.realm;

      /**
       * returns current user data if an user is logged in
       * @returns {Object} user data
       */
      this.getValue = () => $.clone( data );

      const showDialog = name => {
        this.element.querySelector( '#' + name + '-form' ).reset();
        const dialog = this.element.querySelector( '#' + name + '-dialog' );
        dialog.classList.remove( 'denied' );
        dialog.showModal();
      };

      const closeDialog = name => {
        this.element.querySelector( '#' + name + '-form' ).reset();
        this.element.querySelector( '#' + name + '-dialog' ).close();
      };

      const onSubmitForm = async ( event, name ) => {
        event.preventDefault();
        const submit_btn = this.element.querySelector( '#' + name + '-submit' );
        submit_btn.disabled = true;
        const { username, password } = $.formData( this.element.querySelector( '#' + name + '-form' ) );
        const dialog = this.element.querySelector( '#' + name + '-dialog' );
        try {
          await this[ name ]( username, password );
          dialog.close()
        } catch ( e ) {
          dialog.classList.add( 'denied' );
          dialog.style.animation = 'none';
          dialog.offsetHeight;
          dialog.style.animation = null;
        }
        submit_btn.disabled = false;
      };

    }
  };
  let b="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[b])return window.ccm.files[b]=component;(b=window.ccm&&window.ccm.components[component.name])&&b.ccm&&(component.ccm=b.ccm);"string"===typeof component.ccm&&(component.ccm={url:component.ccm});let c=(component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)||[""])[0];if(window.ccm&&window.ccm[c])window.ccm[c].component(component);else{var a=document.createElement("script");document.head.appendChild(a);component.ccm.integrity&&a.setAttribute("integrity",component.ccm.integrity);component.ccm.crossorigin&&a.setAttribute("crossorigin",component.ccm.crossorigin);a.onload=function(){(c="latest"?window.ccm:window.ccm[c]).component(component);document.head.removeChild(a)};a.src=component.ccm.url}
} )();