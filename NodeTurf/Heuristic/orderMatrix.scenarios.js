
var orders = [
    {
      "_id": "ORD0001",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0001_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          }
        ],
        "snapshots": [],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2,
            "_id": "5aa616594397156122e9134d"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0001_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0002",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0002_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10002",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10002",
            "quantity": 3,
            "_id": "5aa616594397156122e9134e"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0002_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10002",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0003",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0003_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2,
            "_id": "5aa616594397156122e9134f"
          },
          {
            "id": "PR10002",
            "quantity": 2,
            "_id": "5aa616594397156122e91350"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0003_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0004",
      "paymentStatus": "Paid",
      "stockAllocation": "PartialAllocated",
      "subOrders": {
        "_id": "ORD0004_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [
          {
            "productId": "PR10002",
            "quantity": 4
          }
        ],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 4
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2,
            "_id": "5aa616594397156122e91351"
          },
          {
            "id": "PR10002",
            "quantity": 4,
            "_id": "5aa616594397156122e91352"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0004_1",
          "blockedProducts": [
            {
              "productId": "PR10002",
              "quantity": 4
            }
          ],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 4
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0005",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0005_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 4
          },
          {
            "productId": "PR10002",
            "quantity": 1
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 4,
            "_id": "5aa616594397156122e91353"
          },
          {
            "id": "PR10002",
            "quantity": 1,
            "_id": "5aa616594397156122e91354"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0005_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 4
            },
            {
              "productId": "PR10002",
              "quantity": 1
            }
          ]
        },
        {
          "_id": "ORD0005_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0005",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0005_2",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 2
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2,
            "_id": "5aa616594397156122e91355"
          },
          {
            "id": "PR10002",
            "quantity": 2,
            "_id": "5aa616594397156122e91356"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0005_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 4
            },
            {
              "productId": "PR10002",
              "quantity": 1
            }
          ]
        },
        {
          "_id": "ORD0005_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0006",
      "paymentStatus": "Paid",
      "stockAllocation": "PartialAllocated",
      "subOrders": {
        "_id": "ORD0006_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 6
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 6,
            "_id": "5aa616594397156122e91357"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0006_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 6
            }
          ]
        },
        {
          "_id": "ORD0006_2",
          "blockedProducts": [
            {
              "productId": "PR1024",
              "quantity": 3
            }
          ],
          "requestedProducts": [
            {
              "productId": "PR1024",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0007",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0007_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 3,
            "_id": "5aa616594397156122e91359"
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0007_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 3
            }
          ]
        },
        {
          "_id": "ORD0007_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10024",
              "quantity": 6
            }
          ]
        }
      ],
      "createdAt": null
    }
  ]


/* [
    {
      "_id": "ORD0001",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0001_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          }
        ],
        "snapshots": [],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0001_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0002",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0002_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10002",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10002",
            "quantity": 3
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0002_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10002",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0003",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0003_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2
          },
          {
            "id": "PR10002",
            "quantity": 3
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0003_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0004",
      "paymentStatus": "Paid",
      "stockAllocation": "PartialAllocated",
      "subOrders": {
        "_id": "ORD0004_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [
          {
            "productId": "PR10002",
            "quantity": 4
          }
        ],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 4
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2
          },
          {
            "id": "PR10002",
            "quantity": 4
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0004_1",
          "blockedProducts": [
            {
              "productId": "PR10002",
              "quantity": 4
            }
          ],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 4
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0005",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0005_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 4
          },
          {
            "productId": "PR10002",
            "quantity": 1
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 4
          },
          {
            "id": "PR10002",
            "quantity": 1
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0005_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 4
            },
            {
              "productId": "PR10002",
              "quantity": 1
            }
          ]
        },
        {
          "_id": "ORD0005_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0005",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0005_2",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 2
          },
          {
            "productId": "PR10002",
            "quantity": 2
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 2
          },
          {
            "id": "PR10002",
            "quantity": 2
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0005_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 4
            },
            {
              "productId": "PR10002",
              "quantity": 1
            }
          ]
        },
        {
          "_id": "ORD0005_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 2
            },
            {
              "productId": "PR10002",
              "quantity": 2
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0006",
      "paymentStatus": "Paid",
      "stockAllocation": "PartialAllocated",
      "subOrders": {
        "_id": "ORD0006_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 6
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 6
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0006_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 6
            }
          ]
        },
        {
          "_id": "ORD0006_2",
          "blockedProducts": [
            {
              "productId": "PR1024",
              "quantity": 3
            }
          ],
          "requestedProducts": [
            {
              "productId": "PR1024",
              "quantity": 3
            }
          ]
        }
      ],
      "createdAt": null
    },
    {
      "_id": "ORD0007",
      "paymentStatus": "Paid",
      "stockAllocation": "NotAllocated",
      "subOrders": {
        "_id": "ORD0007_1",
        "invoiced": false,
        "readyForBatching": false,
        "status": "Confirmed",
        "blockedProducts": [],
        "requestedProducts": [
          {
            "productId": "PR10001",
            "quantity": 3
          }
        ],
        "products": [
          {
            "id": "PR10001",
            "quantity": 3
          }
        ]
      },
      "data": [
        {
          "_id": "ORD0007_1",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10001",
              "quantity": 3
            }
          ]
        },
        {
          "_id": "ORD0007_2",
          "blockedProducts": [],
          "requestedProducts": [
            {
              "productId": "PR10024",
              "quantity": 6
            }
          ]
        }
      ],
      "createdAt": null
    }
  ] */


module.exports  = {
    orders : orders
}