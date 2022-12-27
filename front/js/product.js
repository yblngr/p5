/*------------------------------------------------------------------------------------------------/
/ Script de la page 'product.html'                                                                /
/ Affichage des détails d'un produit et gestion de l'ajout au panier                              /
/------------------------------------------------------------------------------------------------*/


// Masquage cosmétique des détails du produit en cas d'erreur
document.querySelector('.item').style.opacity = '0';

// Récupération de l'id du produit passé en paramètre de l'URL
const productId = new URLSearchParams(document.location.search).get('id');

// Récupération des détails du produit (requête GET)
fetch(`http://localhost:3000/api/products/${productId}`)
  .then(response => {
    if (productId === null || productId === '') throw new Error('ID de produit non spécifié');
    if (!response.ok) throw new Error('ID de produit inconnu : ' + productId);
    return response.json();
  })

  // Ajout des détails du produit à la page
  .then(product => {
    document.getElementsByClassName('item__img')[0].innerHTML = `<img src="${product.imageUrl}" alt="${product.altTxt}">`;
    document.getElementById('title').innerText = product.name;
    document.getElementById('price').innerText = product.price;
    document.getElementById('description').innerText = product.description;
    product.colors.forEach(color => {
      document.getElementById('colors').insertAdjacentHTML('beforeend', `<option value="${color}">${color}</option>`);
    });

    // Ajout d'un élément d'information d'ajout de produit
    const infoElement = document.createElement('p');
    document.querySelector('.item').firstElementChild.appendChild(infoElement);

    // Initialisation du nombre total d'articles ajoutés au panier
    let totalQuantity = 0;

    // Activation ou désactivation du bouton 'Ajouter au panier'
    setAddToCartStatus();


    /*--------------------------------------------------------------------------------------------/
    / Gestionnaires d'événements                                                                  /
    /--------------------------------------------------------------------------------------------*/

    // Modification de la couleur (pendant la saisie)
    document.getElementById('colors').addEventListener('input', setAddToCartStatus);

    // Modification de la quantité (pendant la saisie)
    document.getElementById('quantity').addEventListener('input', event => {
      const target = event.currentTarget;
      setAddToCartStatus();
      target.reportValidity();
    });

    // Modification de la quantité (à la perte du focus)
    document.getElementById('quantity').addEventListener('blur', event => {
      const target = event.currentTarget;
      // Transformation cosmétique de '+3' (valide) en '3', ou '2.0' (valide) en '2'
      if (target.checkValidity()) { target.value = (+target.value).toString() }
    });

    // Bouton 'Ajouter au panier' (au clic)
    document.getElementById('addToCart').addEventListener('click', () => {
      const productColor = document.getElementById('colors').value;
      const productQuantity = +document.getElementById('quantity').value;
      // Ajout du ou des articles dans le panier
      const cart = (!localStorage.getItem('cart')) ? [] : JSON.parse(localStorage.getItem('cart'));
      if (cart.find(item => (item.id === productId && item.color === productColor)) === undefined) {
        cart.push({ id: productId, color: productColor, quantity: productQuantity });
        cart.sort((a, b) => { return (a.id < b.id) ? -1 : (a.id > b.id) ? 1 : (a.color < b.color) ? -1 : 1 });
      } else {
        cart[cart.findIndex(item => (item.id === productId && item.color === productColor))].quantity += productQuantity;
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      // Affichage du nombre total d'articles ajoutés
      totalQuantity += productQuantity;
      infoElement.innerText = totalQuantity + ((totalQuantity > 1) ? ' articles ajoutés' : ' article ajouté') + ' au panier';
    });


    /*--------------------------------------------------------------------------------------------/
    / Fonctions                                                                                   /
    /--------------------------------------------------------------------------------------------*/

    // Test de validité d'un champ de saisie
    // Valeur retournée : 'true' si la saisie est valide, 'false' sinon
    function checkInputValidity(input) {
      const value = input.value;
      let errorMsg = '';
      switch (input.id) {

        // Règles de validité d'une quantité d'articles
        case 'colors':
          if (value.length === 0) { errorMsg = 'Veuillez sélectionner une couleur dans la liste.' }
          break;

        // Règles de validité d'une quantité d'articles
        case 'quantity':
          if (value.length === 0) { errorMsg = 'Veuillez saisir un nombre d\'articles.' }
          if (input.validity.badInput) { errorMsg = 'Veuillez saisir un nombre.' }
          if (input.validity.stepMismatch) { errorMsg = 'Veuillez saisir un nombre entier.' }
          if (input.validity.rangeOverflow) { errorMsg = 'Veuillez saisir un nombre inférieur ou égal à 100.' }
          if (input.validity.rangeUnderflow) { errorMsg = 'Veuillez saisir un nombre supérieur ou égal à 1.' }
          break;
      }
      input.setCustomValidity(errorMsg);
      return input.checkValidity();
    }

    // Test de validité d'un champ de saisie et signalement à l'utilisateur
    // Valeur retournée : 'true' si la saisie est valide, 'false' sinon
    function reportInputValidity(input) {
      input.style.backgroundColor = (checkInputValidity(input)) ? '' : '#fbbcbc';
      return input.checkValidity();
    }

    // Activation ou désactivation du bouton 'Ajouter au panier'
    // Le bouton est activé si tous les champs de saisie sont valides
    function setAddToCartStatus() {
      const addToCart = document.getElementById('addToCart');
      // Pour éviter l'évaluation en court-circuit
      if ([document.getElementById('colors'), document.getElementById('quantity')]
        .map(input => reportInputValidity(input))
        .reduce((accumulator, value) => accumulator && value, true)
      ) {
        addToCart.disabled = '';
        addToCart.style.opacity = '';
        addToCart.style.cursor = '';
      } else {
        addToCart.disabled = true;
        addToCart.style.opacity = '0.25';
        addToCart.style.cursor = 'auto';
      }
    }
  })


  // Traitement d'erreur
  .catch(error => {
    const message = (error.name === 'TypeError') ? 'Catalogue non disponible' : 'Produit introuvable';
    document.querySelector('.item').innerHTML = `<p>${message} !</p>`;
    console.error(`${message}\n${error.message}`);
  })

  // Affichage des détails du produit
  .finally(() => { document.querySelector('.item').style.opacity = '1' });
  