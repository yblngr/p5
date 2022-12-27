/*------------------------------------------------------------------------------------------------/
/ Script de la page 'cart.html'                                                                   /
/ Affichage du panier et du formulaire de commande                                                /
/------------------------------------------------------------------------------------------------*/


// Masquage cosmétique du panier en cas d'erreur
document.querySelector('.cart').style.opacity = '0';

// Récupération de l'ensemble des produits (requête GET)
fetch('http://localhost:3000/api/products/')

  .then(response => {
    if (!response.ok) { throw new Error(`Echec de la requête GET : fetch('${response.url}')`) }
    return response.json();
  })

  // Ajout des articles du paniers à la page
  .then(products => {
    let cart = (!localStorage.getItem('cart')) ? [] : JSON.parse(localStorage.getItem('cart'));
    if (cart.length === 0) { throw new Error('Panier vide au chargement de la page') }
    cart.forEach(item => {
      const product = products.find(product => product._id === item.id);
      document.getElementById('cart__items').insertAdjacentHTML('beforeend',
        `<article class="cart__item" data-id="${item.id}" data-color="${item.color}">
            <div class="cart__item__img">
              <img src="${product.imageUrl}" alt="${product.altTxt}">
            </div>
            <div class="cart__item__content">
              <div class="cart__item__content__description">
                <h2>${product.name}</h2>
                <p>${item.color}</p>
                <p>${product.price} €</p>
              </div>
              <div class="cart__item__content__settings">
                <div class="cart__item__content__settings__quantity">
                  <p>Qté : </p>
                  <input type="number" class="itemQuantity" name="itemQuantity" min="1" max="100" value="${item.quantity}">
                </div>
                <div class="cart__item__content__settings__delete">
                  <p class="deleteItem">Supprimer</p>
                </div>
              </div>
            </div>
          </article>
          `);
    });

    // Mise à jour du nombre total d'articles et du prix total
    updateAmount();

    // Activation ou désactivation du bouton 'Commander'
    setOrderStatus();


    /*--------------------------------------------------------------------------------------------/
    / Gestionnaires d'événements                                                                  /
    /--------------------------------------------------------------------------------------------*/

    document.querySelectorAll('.itemQuantity')
      .forEach(element => {

        // Modification de la quantité (pendant la saisie)
        element.addEventListener('input', event => {
          const target = event.currentTarget;
          setOrderStatus();
          target.reportValidity();
        });

        // Modification de la quantité (au changement)
        element.addEventListener('change', event => {
          const target = event.currentTarget;
          const targetItem = target.closest('.cart__item');
          if (target.checkValidity()) {
            cart[cart.findIndex(item => (item.id === targetItem.dataset.id && item.color === targetItem.dataset.color))].quantity = +target.value;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateAmount();
          }
        });

        // Modification de la quantité (à la perte du focus)
        element.addEventListener('blur', event => {
          const target = event.currentTarget;
          // Transformation cosmétique de '+3' (valide) en '3', ou '2.0' (valide) en '2'
          if (target.checkValidity()) { target.value = (+target.value).toString() }
        });
      });

    document.querySelectorAll('.deleteItem')
      .forEach(element => {

        // Bouton 'Supprimer' (au clic)
        element.addEventListener('click', event => {
          const targetItem = event.currentTarget.closest('.cart__item');
          cart = cart.filter(item => !(item.id === targetItem.dataset.id && item.color === targetItem.dataset.color));
          localStorage.setItem('cart', JSON.stringify(cart));
          targetItem.remove();
          updateAmount();
        });
      });

    // Modification des champs du formulaire (pendant la saisie)
    document.querySelectorAll('.cart__order__form__question input')
      .forEach(element => { element.addEventListener('input', setOrderStatus) });

    // Bouton 'Commander' (au clic)
    document.getElementById('order').addEventListener('click', event => {
      // Evite de déclencher l'action par défaut du bouton
      event.preventDefault();
      const orderObject = {
        'contact': {
          'firstName': document.getElementById('firstName').value,
          'lastName': document.getElementById('lastName').value,
          'address': document.getElementById('address').value,
          'city': document.getElementById('city').value,
          'email': document.getElementById('email').value
        },
        'products': cart.map(item => item.id)
      };

      // Envoi de la commande (requête POST)
      fetch('http://localhost:3000/api/products/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderObject)
      })

        .then(response => {
          if (!response.ok) { throw new Error(`Echec de la requête POST : fetch('${response.url}')`) }
          return response.json();
        })

        // Récupération du numéro de commande
        .then(confirmedOrder => { window.location.href = './confirmation.html?orderid=' + confirmedOrder.orderId })

        .catch(error => errorHandler(error));
    });


    /*--------------------------------------------------------------------------------------------/
    / Fonctions                                                                                   /
    /--------------------------------------------------------------------------------------------*/


    // Mise à jour du nombre total d'articles et du prix total
    function updateAmount() {

      // Récupération de l'ensemble des produits (requête GET)
      fetch('http://localhost:3000/api/products/')

        .then(response => {
          if (cart.length === 0) { throw new Error('Panier vide après suppression de tous les articles') }
          if (!response.ok) { throw new Error(`Echec de la requête GET : fetch('${response.url}')`) }
          return response.json();
        })

        // Sommation du nombre d'articles et du prix
        .then(products => {
          let totalQuantity = 0;
          let totalPrice = 0;
          cart.forEach(item => {
            totalQuantity += +item.quantity;
            totalPrice += +item.quantity * products.find(product => product._id === item.id).price;
          });
          document.getElementById('totalQuantity').innerText = totalQuantity;
          document.getElementById('totalPrice').innerText = totalPrice;
        })

        .catch(error => errorHandler(error));
    }

    // Test de validité d'un champ de saisie
    // Valeur retournée : 'true' si la saisie est valide, 'false' sinon
    function checkInputValidity(input) {
      const value = input.value;
      let errorMsg = '';
      switch (input.id) {

        // Règles de validité d'une quantité d'articles
        case '':
          if (value.length === 0) { errorMsg = 'Veuillez saisir un nombre d\'articles.' }
          if (input.validity.badInput) { errorMsg = 'Veuillez saisir un nombre.' }
          if (input.validity.stepMismatch) { errorMsg = 'Veuillez saisir un nombre entier.' }
          if (input.validity.rangeOverflow) { errorMsg = 'Veuillez saisir un nombre inférieur ou égal à 100.' }
          if (input.validity.rangeUnderflow) { errorMsg = 'Veuillez saisir un nombre supérieur ou égal à 1.' }
          break;

        // Règles de validité du prénom
        case 'firstName':
          if (value.length < 2) { errorMsg = 'Votre prénom doit comporter au moins 2 caractères.' }
          if (value.length > 22) { errorMsg = 'Votre prénom doit comporter au plus 22 caractères.' }
          if (value.match(/^.?-|-.?-|-.?$/)) { errorMsg = 'Un trait d\'union doit séparer deux prénoms d\'un prénom composé.' }
          if (value.match(/^'|-'|'-|'$/)) { errorMsg = 'L\'apostrophe doit être précédée et suivie d\'un caractère alphabétique.' }
          if (value.match(/[^A-Za-zÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸzàâäçéèêëîïôöùûüÿ\-']/)) {
            errorMsg = 'Seuls les caractères alphabétiques, les traits d\'union et l\'apostrophe sont autorisés.';
          }
          if (value.length === 0) { errorMsg = 'Veuillez saisir votre prénom.' }
          break;

        // Règles de validité du nom
        case 'lastName':
          if (value.length < 2) { errorMsg = 'Votre nom doit comporter au moins 2 caractères.' }
          if (value.length > 55) { errorMsg = 'Votre nom doit comporter au plus 55 caractères.' }
          if (value.match(/^.?-|-.?-|-.?$/)) { errorMsg = 'Un trait d\'union doit séparer deux noms d\'un nom composé.' }
          if (value.match(/^.? | .? | .?$/)) { errorMsg = 'Une espace doit séparer deux noms d\'un nom composé.' }
          if (value.match(/^'|[- ]'|'[- ]|'$/)) { errorMsg = 'L\'apostrophe doit être précédée et suivie d\'un caractère alphabétique.' }
          if (value.match(/[^A-Za-zÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸzàâäçéèêëîïôöùûüÿ\-' ]/)) {
            errorMsg = 'Seuls les caractères alphabétiques, les traits d\'union, l\'apostrophe et l\'espace sont autorisés.';
          }
          if (value.length === 0) { errorMsg = 'Veuillez saisir votre nom.' }
          break;

        // Règles de validité de l'adresse
        case 'address':
          if (value.length < 2) { errorMsg = 'Votre adresse doit comporter au moins 2 caractères.' }
          if (value.length > 60) { errorMsg = 'Votre adresse doit comporter au plus 60 caractères.' }
          if (value.match(/[^0-9A-Za-zÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸzàâäçéèêëîïôöùûüÿ\-'"().,° ]/)) {
            errorMsg = 'Votre adresse comporte un caractère non autorisé.';
          }
          if (value.length === 0) { errorMsg = 'Veuillez saisir votre adresse.' }
          break;

        // Règles de validité de la ville
        case 'city':
          if (value.length > 45) { errorMsg = 'Le nom de Votre commune doit comporter au plus 45 caractères.' }
          if (value.match(/^.?-|-.?-|-.?$/)) { errorMsg = 'Un trait d\'union doit séparer deux mots d\'un nom composé.' }
          if (value.match(/^.? | .? | .?$/)) { errorMsg = 'Une espace doit séparer deux mots d\'un nom composé.' }
          if (value.match(/^'|[- ]'|'[- ]|'$/)) { errorMsg = 'L\'apostrophe doit être précédée et suivie d\'un caractère alphabétique.' }
          if (value.match(/[^A-Za-zÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸzàâäçéèêëîïôöùûüÿ\-' ]/)) {
            errorMsg = 'Seuls les caractères alphabétiques, les traits d\'union, l\'apostrophe et l\'espace sont autorisés.';
          }
          if (value.length === 0) { errorMsg = 'Veuillez saisir le nom de votre commune.' }
          break;

        // Règles de validité de l'adresse e-mail
        case 'email':
          if (!value.match(/@.+(\.[^.]{2,})$/)) { errorMsg = 'Votre adresse doit comporter une extension de nom de domaine valide.' }
          if (input.validity.typeMismatch) { errorMsg = 'Veuillez saisir une adresse e-mail valide.' }
          if (value.match(/@$/)) { errorMsg = 'Votre adresse doit comporter un nom de domaine.' }
          if (value.match(/^@/)) { errorMsg = 'Votre adresse doit comporter une partie locale.' }
          if (value.match(/\.\./)) { errorMsg = 'Votre adresse ne doit pas comporter 2 points consécutifs.' }
          if (value.match(/^\.|\.@|@\.|\.$/)) { errorMsg = 'Votre adresse ne doit pas commencer ou terminer par un point.' }
          if (value.match(/[^0-9A-Za-z!#$%&'*+-/=?^_`.{|}~@]/)) {
            errorMsg = 'Votre adresse doit comporter des lettres majuscules ou minuscules, des chiffres, \
            et/ou des caractères spéciaux parmi :\n! # $ % & \' * + - / = ?  ^ _ ` . { | } ~';
          }
          if (value.length === 0) { errorMsg = 'Veuillez saisir votre adresse e-mail.' }
          break;
      }
      input.setCustomValidity(errorMsg);
      return input.checkValidity();
    }

    // Test de validité d'un champ de saisie et signalement à l'utilisateur
    // Valeur retournée : 'true' si la saisie est valide, 'false' sinon
    function reportInputValidity(input) {
      input.style.backgroundColor = (checkInputValidity(input)) ? '' : '#fbbcbc';
      if (input.id !== '') { document.getElementById(input.id + 'ErrorMsg').innerText = input.validationMessage }
      return input.checkValidity();
    }

    // Activation ou désactivation du bouton 'Commander'
    // Le bouton est activé si tous les champs de saisie sont valides
    function setOrderStatus() {
      const order = document.getElementById('order');
      if (Array.from(document.querySelectorAll('.itemQuantity'))
        .concat(Array.from(document.querySelectorAll('.cart__order__form__question input')))
        .map(input => reportInputValidity(input))
        .reduce((accumulator, value) => accumulator && value, true)
      ) {
        order.disabled = '';
        order.style.opacity = '';
        order.style.cursor = '';
      } else {
        order.disabled = true;
        order.style.opacity = '0.25';
        order.style.cursor = 'auto';
      }
    }
  })


  // Traitement d'erreur
  .catch(error => errorHandler(error))

  // Affichage du panier
  .finally(() => { document.querySelector('.cart').style.opacity = '1' });


// Gestionnaire d' erreurs
function errorHandler(error) {
  const message = (error.name === 'TypeError') ? 'Catalogue non disponible' : 'Votre panier est vide';
  document.querySelector('.cart').innerHTML = `${message} !`;
  document.querySelector('.cart').style.textAlign = 'center';
  console.error(`${message}\n${error.message}`);
}
