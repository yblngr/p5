/*------------------------------------------------------------------------------------------------/
/ Script de la page 'confirmation.html'                                                           /
/ Affichage du numéro de commande                                                                 /
/------------------------------------------------------------------------------------------------*/


// Récupération du numéro de commande passé en paramètre de l'URL
const orderId = new URLSearchParams(document.location.search).get('orderid');

if (orderId !== null && orderId !== '') {
  document.getElementById('orderId').innerText = orderId;
  localStorage.removeItem('cart');
} else {
  document.getElementById('orderId').parentElement.innerText = 'Commande introuvable !';
}
