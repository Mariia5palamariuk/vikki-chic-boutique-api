import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const GOODS_TABLE = "goods";
const USERS_TABLE = "users";
const ORDERS_TABLE = "orders";

export const handler = async (event) => {
  const users = [
    {
      id: 1,
      name: "Maria",
      email: "maria@example.com",
      password: "123456"
    },
    {
      id: 2,
      name: "Anna",
      email: "anna@example.com",
      password: "qwerty"
    }
  ];

  const goods = [
    {
      id: 1,
      name: "Сукня міді",
      price: 1200,
      category: "Сукні"
    },
    {
      id: 2,
      name: "Футболка oversize",
      price: 550,
      category: "Футболки"
    },
    {
      id: 3,
      name: "Джинси mom fit",
      price: 1500,
      category: "Джинси"
    }
  ];

  const orders = [
    {
      id: 1,
      userId: 1,
      customerName: "Maria",
      items: [
        { goodId: 1, quantity: 1 },
        { goodId: 3, quantity: 2 }
      ],
      totalPrice: 4200,
      status: "new"
    },
    {
      id: 2,
      userId: 2,
      customerName: "Anna",
      items: [
        { goodId: 2, quantity: 3 }
      ],
      totalPrice: 1650,
      status: "processing"
    }
  ];

  const method = event.httpMethod;
  const path = event.resource;
  const id = event.pathParameters?.id;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  if (method === "OPTIONS") {
    console.log("OPTIONS request reached Lambda", {
      method,
      path,
      resource: event.resource
    });
  
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS OK" })
    };
  }

  const getAuthHeader = () => {
    return event.headers?.Authorization || event.headers?.authorization;
  };

  const getTokenFromHeader = () => {
    const authHeader = getAuthHeader();

    if (!authHeader) {
      return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    return authHeader.replace("Bearer ", "");
  };

  const getUserByToken = async () => {
    const token = getTokenFromHeader();
  
    if (!token) {
      return null;
    }
  
    const match = token.match(/^test-token-user-(.+)$/);
  
    if (!match) {
      return null;
    }
  
    const userId = match[1];
  
    const usersScanCommand = new ScanCommand({
      TableName: USERS_TABLE
    });
  
    const usersResult = await docClient.send(usersScanCommand);
    const existingUsers = usersResult.Items || [];
  
    return existingUsers.find(user => String(user.id) === String(userId)) || null;
  };

  const isAdmin = (user) => {
    return user && user.role === "admin";
  };

  // ===== ROOT =====
  if (method === "GET" && path === "/") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Welcome to Vikki Chic Boutique API"
      })
    };
  }

  // ===== AUTH =====
  if (method === "POST" && path === "/auth/signup") {
    const { email, password } = JSON.parse(event.body);
  
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Email і пароль обов'язкові"
        })
      };
    }
  
    const usersScanCommand = new ScanCommand({
      TableName: USERS_TABLE
    });
  
    const usersResult = await docClient.send(usersScanCommand);
    const existingUsers = usersResult.Items || [];
  
    const existingUser = existingUsers.find(user => user.email === email);
  
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: "Користувач з таким email вже існує"
        })
      };
    }
  
    const createdUser = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      password,
      role: "user"
    };
  
    const putCommand = new PutCommand({
      TableName: USERS_TABLE,
      Item: createdUser
    });
  
    await docClient.send(putCommand);
  
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Користувача створено успішно",
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role
        }
      })
    };
  }

  if (method === "POST" && path === "/auth/login") {
    const { email, password } = JSON.parse(event.body);
  
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Email і пароль обов'язкові"
        })
      };
    }
  
    const usersScanCommand = new ScanCommand({
      TableName: USERS_TABLE
    });
  
    const usersResult = await docClient.send(usersScanCommand);
    const existingUsers = usersResult.Items || [];
  
    const user = existingUsers.find(
      user => user.email === email && user.password === password
    );
  
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Невірний email або пароль"
        })
      };
    }
  
    const token = `test-token-user-${user.id}`;
  
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user"
        }
      })
    };
  }

  if (method === "POST" && path === "/auth/restore") {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Email обов'язковий"
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Інструкція для відновлення пароля надіслана"
      })
    };
  }

  // ===== GOODS =====
if (method === "GET" && path === "/goods") {
  const command = new ScanCommand({
    TableName: GOODS_TABLE
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Items || [])
  };
}

if (method === "GET" && path === "/goods/{id}") {
  const good = goods.find(item => item.id === Number(id));

  if (!good) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        message: "Товар не знайдено"
      })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(good)
  };
}

if (method === "POST" && path === "/goods") {
  const currentUser = await getUserByToken();

if (!currentUser) {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({
      message: "Потрібна авторизація"
    })
  };
}

if (!isAdmin(currentUser)) {
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({
      message: "Доступ дозволено тільки адміну"
    })
  };
}
  const newGood = JSON.parse(event.body);

  const item = {
    id: Date.now().toString(),
    name: newGood.name,
    brand: newGood.brand || "",
    price: Number(newGood.price) || 0,
    category: newGood.category || "",
    size: newGood.size || "",
    color: newGood.color || "",
    stock: Number(newGood.stock) || 0,
    imageUrl: newGood.imageUrl || ""
  };

  const command = new PutCommand({
    TableName: GOODS_TABLE,
    Item: item
  });

  await docClient.send(command);

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      message: "Товар створено в DynamoDB",
      good: item
    })
  };
}

if (method === "PUT" && path === "/goods/{id}") {
  const currentUser = await getUserByToken();

if (!currentUser) {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({
      message: "Потрібна авторизація"
    })
  };
}

if (!isAdmin(currentUser)) {
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({
      message: "Доступ дозволено тільки адміну"
    })
  };
}
  const updatedData = JSON.parse(event.body);

  const command = new UpdateCommand({
    TableName: GOODS_TABLE,
    Key: { id: id },
    UpdateExpression: `
      SET 
        #name = :name,
        brand = :brand,
        price = :price,
        category = :category,
        size = :size,
        color = :color,
        stock = :stock,
        imageUrl = :imageUrl
    `,
    ExpressionAttributeNames: {
      "#name": "name"
    },
    ExpressionAttributeValues: {
      ":name": updatedData.name,
      ":brand": updatedData.brand || "",
      ":price": Number(updatedData.price) || 0,
      ":category": updatedData.category || "",
      ":size": updatedData.size || "",
      ":color": updatedData.color || "",
      ":stock": Number(updatedData.stock) || 0,
      ":imageUrl": updatedData.imageUrl || ""
    },
    ReturnValues: "ALL_NEW"
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "Товар оновлено",
      good: result.Attributes
    })
  };
}

if (method === "DELETE" && path === "/goods/{id}") {
  const currentUser = await getUserByToken();

if (!currentUser) {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({
      message: "Потрібна авторизація"
    })
  };
}

if (!isAdmin(currentUser)) {
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({
      message: "Доступ дозволено тільки адміну"
    })
  };
}
  const command = new DeleteCommand({
    TableName: GOODS_TABLE,
    Key: {
      id: id
    }
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "Товар видалено з DynamoDB",
      id
    })
  };
}

  // ===== ORDERS =====
  if (method === "GET" && path === "/orders") {
    const currentUser = await getUserByToken();

    if (!currentUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Потрібна авторизація"
        })
      };
    }

    const userOrders = orders.filter(order => order.userId === currentUser.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userOrders)
    };
  }

  //====ORDERS======
  if (method === "GET" && path === "/orders/{id}") {
    const currentUser = await getUserByToken();
  
    if (!currentUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Потрібна авторизація"
        })
      };
    }
  
    const ordersScanCommand = new ScanCommand({
      TableName: ORDERS_TABLE
    });
  
    const ordersResult = await docClient.send(ordersScanCommand);
    const allOrders = ordersResult.Items || [];
  
    const order = allOrders.find(item => String(item.id) === String(id));
  
    if (!order) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: "Замовлення не знайдено"
        })
      };
    }
  
    if (String(order.userId) !== String(currentUser.id)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "Немає доступу до цього замовлення"
        })
      };
    }
  
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(order)
    };
  }

  if (method === "POST" && path === "/orders") {
    const currentUser = await getUserByToken();
  
    if (!currentUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Потрібна авторизація"
        })
      };
    }
  
    const { items, totalPrice } = JSON.parse(event.body);
  
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Замовлення повинно містити товари"
        })
      };
    }
  
    const createdOrder = {
      id: Date.now().toString(),
      userId: String(currentUser.id),
      customerName: currentUser.name,
      items,
      totalPrice: Number(totalPrice) || 0,
      status: "new",
      createdAt: new Date().toISOString()
    };
  
    const putCommand = new PutCommand({
      TableName: ORDERS_TABLE,
      Item: createdOrder
    });
  
    await docClient.send(putCommand);
  
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Замовлення створено успішно",
        order: createdOrder
      })
    };
  }

  if (method === "PUT" && path === "/orders/{id}") {
    const currentUser = await getUserByToken();

    if (!currentUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Потрібна авторизація"
        })
      };
    }

    const updatedData = JSON.parse(event.body);
    const existingOrder = orders.find(item => item.id === Number(id));

    if (!existingOrder) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: "Замовлення не знайдено"
        })
      };
    }

    if (existingOrder.userId !== currentUser.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "Немає доступу до цього замовлення"
        })
      };
    }

    const updatedOrder = {
      ...existingOrder,
      ...updatedData,
      id: Number(id),
      userId: currentUser.id
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Замовлення оновлено успішно",
        order: updatedOrder
      })
    };
  }

  if (method === "DELETE" && path === "/orders/{id}") {
    const currentUser = await getUserByToken();

    if (!currentUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Потрібна авторизація"
        })
      };
    }

    const existingOrder = orders.find(item => item.id === Number(id));

    if (!existingOrder) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: "Замовлення не знайдено"
        })
      };
    }

    if (existingOrder.userId !== currentUser.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "Немає доступу до цього замовлення"
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Замовлення видалено успішно",
        order: existingOrder
      })
    };
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({
      message: "Маршрут не знайдено"
    })
  };
};