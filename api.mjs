'use strict';

// =========================================================================
// Основний код обробника Lambda API
// =========================================================================
export async function handler(event) {
  console.log('--> API request event:', {
    method: event.httpMethod,
    path: event.resource,
    pathParameters: event.pathParameters,
    body: event.body,
    headers: event.headers,
    stage: event.requestContext?.stage
  });

  let goodsItems = null;
  let ordersItems = null;
  let statusCode = null;
  let body = null;

  const method = event.httpMethod;        // GET, POST, PUT, DELETE
  const path = event.resource;            // наприклад "/devices" або "/devices/{id}"
  const pathParams = event.pathParameters; // { id: "2" } якщо URL /devices/2

  try {

    switch (method) {
      // ==========================================
      // CORS Preflight - про всяк випадок (насправді налаштування CORS вже є в API Gateway)
      // ==========================================    
      case 'OPTIONS':
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
          },
          body: ''
        };

      // ==========================================
      // 1) GET
      // ==========================================
      case 'GET':
        switch (path) {
          case '/':
            goodsItems = 'Welcome to Vikki Chic Boutique API';
            statusCode = 200;
            body = JSON.stringify(goodsItems);
            break;

          default:
            statusCode = 404;
            body = JSON.stringify({ error: '>>>> Wrong endpoint for GET method' });
        }
        break;

      // ==========================================
      // 2) POST /goods, POST /orders
      // ==========================================
      case 'POST':
        switch (path) {
          case '/goods':

            break;
          case '/orders':

            break;
          default:
            statusCode = 404;
            body = JSON.stringify({ error: '>>>> Unknown resource for POST method' });
        }
        break;

      // ==========================================
      // 3) PUT /goods/{id}, PUT /orders/{id}
      // ==========================================
      //      event.resource === "/goods/{id}" під час налаштування в API Gateway
      case 'PUT':
        if (path === '/goods/{id}') {

        }  else if (path === '/orders/{id}') {

        }
        break;

      //  ==========================================
      // 4) DELETE /goods/{id}
      //  ==========================================
      case 'DELETE':
        if (path === '/goods/{id}') {

        } else if (path === '/orders/{id}') {

        }
        break;

      // ==========================================
      // Якщо жоден із маршрутів не спрацював:
      // ==========================================
      default:
        if (!statusCode && !body) {
          statusCode = 405;
          body = JSON.stringify({ error: '>>>> Unknown method' });
        }
    }


  } catch (error) {
    console.error('>>>> Handler error:', error);
    statusCode = 500;
    body = JSON.stringify({ error: '>>>> Internal server error' });
  }

  return {
    statusCode,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'
    }
  };
}