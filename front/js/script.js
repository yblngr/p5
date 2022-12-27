/*------------------------------------------------------------------------------------------------/
/ Script de la page d'accueil 'index.html'                                                        /
/ Affichage de tous les produits disponibles à la vente                                           /
/------------------------------------------------------------------------------------------------*/


// Récupération de l'ensemble des produits (requête GET)
fetch('http://localhost:3000/api/products/')

  .then(response => {
    if (!response.ok) throw new Error(`${response.url} : ${response.statusText}`);
    return response.json();
  })

  // Ajout des produits à la page
  .then(products => {
    products.forEach(product => {
      document.getElementById('items').insertAdjacentHTML('beforeend',
        `<a href="./product.html?id=${product._id}">
          <article>
            <img src="${product.imageUrl}" alt="${product.altTxt}">
            <h3 class="productName">${product.name}</h3>
            <p class="productDescription">${product.description}</p>
          </article>
        </a>`
      );
    });
  })

  // Traitement d'erreur
  .catch((error) => {
    const message = 'Catalogue non disponible';
    document.getElementById('items').innerHTML = `<p>${message} !</p>`;
    console.error(`${message}\n${error.message}`);
  });
