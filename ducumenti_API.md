{
  "openapi": "3.1.0",
  "info": {
    "title": "Bisness SAIDE - Gestão de Vendas",
    "version": "1.0.1"
  },
  "paths": {
    "/auth/login": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Login do utilizador",
        "operationId": "login_auth_login_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Token JWT e dados do utilizador",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TokenResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/auth/register": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Registar novo utilizador (apenas Gestor)",
        "operationId": "register_auth_register_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Dados do utilizador criado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UtilizadorResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/auth/utilizadores": {
      "get": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Listar utilizadores (apenas Gestor)",
        "operationId": "listar_utilizadores_auth_utilizadores_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/UtilizadorResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Utilizadores Auth Utilizadores Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/auth/me": {
      "get": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Dados do utilizador autenticado",
        "operationId": "me_auth_me_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UtilizadorResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/produtos": {
      "get": {
        "tags": [
          "Produtos"
        ],
        "summary": "Listar produtos ativos",
        "operationId": "listar_produtos_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/ProdutoResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Produtos Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      },
      "post": {
        "tags": [
          "Produtos"
        ],
        "summary": "Criar produto (Gestor)",
        "operationId": "criar_produtos_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ProdutoCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProdutoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/produtos/{id}": {
      "get": {
        "tags": [
          "Produtos"
        ],
        "summary": "Detalhes de um produto",
        "operationId": "buscar_produtos__id__get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProdutoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Produtos"
        ],
        "summary": "Atualizar produto (Gestor)",
        "operationId": "atualizar_produtos__id__put",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ProdutoUpdate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProdutoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Produtos"
        ],
        "summary": "Desativar produto (Gestor)",
        "operationId": "remover_produtos__id__delete",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/produtos/stock/baixo": {
      "get": {
        "tags": [
          "Produtos"
        ],
        "summary": "Produtos abaixo do stock mínimo (Gestor)",
        "operationId": "stock_baixo_produtos_stock_baixo_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/ProdutoStockBaixo"
                  },
                  "type": "array",
                  "title": "Response Stock Baixo Produtos Stock Baixo Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/clientes": {
      "get": {
        "tags": [
          "Clientes"
        ],
        "summary": "Listar clientes",
        "operationId": "listar_clientes_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/ClienteResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Clientes Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      },
      "post": {
        "tags": [
          "Clientes"
        ],
        "summary": "Criar cliente",
        "operationId": "criar_clientes_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ClienteCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ClienteResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/clientes/{id}": {
      "get": {
        "tags": [
          "Clientes"
        ],
        "summary": "Detalhes de um cliente",
        "operationId": "buscar_clientes__id__get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ClienteResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Clientes"
        ],
        "summary": "Atualizar cliente",
        "operationId": "atualizar_clientes__id__put",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ClienteUpdate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ClienteResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/vendas": {
      "get": {
        "tags": [
          "Vendas"
        ],
        "summary": "Listar vendas",
        "operationId": "listar_vendas_get",
        "responses": {
          "200": {
            "description": "Gestor vê todas, Operador vê apenas as suas",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/VendaResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Vendas Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      },
      "post": {
        "tags": [
          "Vendas"
        ],
        "summary": "Registar nova venda",
        "operationId": "criar_vendas_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/VendaCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Venda criada com cálculo de IVA, desconto e atualização de stock",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VendaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/vendas/{id}": {
      "get": {
        "tags": [
          "Vendas"
        ],
        "summary": "Detalhes de uma venda",
        "operationId": "buscar_vendas__id__get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VendaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/stock/movimento": {
      "post": {
        "tags": [
          "Stock"
        ],
        "summary": "Registar movimento de stock (Gestor)",
        "operationId": "criar_movimento_stock_movimento_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MovimentoCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Movimento registado e stock atualizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MovimentoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/stock/movimentos": {
      "get": {
        "tags": [
          "Stock"
        ],
        "summary": "Histórico de movimentos (Gestor)",
        "operationId": "listar_movimentos_stock_movimentos_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "produto_id",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "uuid"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filtrar por produto",
              "title": "Produto Id"
            },
            "description": "Filtrar por produto"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/MovimentoResponse"
                  },
                  "title": "Response Listar Movimentos Stock Movimentos Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/vendas/periodo": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Vendas por período",
        "operationId": "vendas_periodo_relatorios_vendas_periodo_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "data_inicio",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time",
              "description": "Data início",
              "examples": [
                "2026-01-01T00:00:00Z"
              ],
              "title": "Data Inicio"
            },
            "description": "Data início"
          },
          {
            "name": "data_fim",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time",
              "description": "Data fim",
              "examples": [
                "2026-12-31T23:59:59Z"
              ],
              "title": "Data Fim"
            },
            "description": "Data fim"
          }
        ],
        "responses": {
          "200": {
            "description": "Totais de vendas, receita, IVA, descontos e lucro no período",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RelatorioVendasPeriodo"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/vendas/diario": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Vendas do dia",
        "operationId": "vendas_diario_relatorios_vendas_diario_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "data",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "date"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Dia. Omite para hoje",
              "examples": [
                "2026-06-27"
              ],
              "title": "Data"
            },
            "description": "Dia. Omite para hoje"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RelatorioVendasPeriodo"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/vendas/mensal": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Vendas do mês",
        "operationId": "vendas_mensal_relatorios_vendas_mensal_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "ano",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Ano",
              "examples": [2026],
              "title": "Ano"
            },
            "description": "Ano"
          },
          {
            "name": "mes",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "maximum": 12,
              "minimum": 1,
              "description": "Mês (1-12)",
              "examples": [6],
              "title": "Mes"
            },
            "description": "Mês (1-12)"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RelatorioVendasPeriodo"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/clientes/fieis": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Clientes fiéis (maior gasto)",
        "operationId": "clientes_fieis_relatorios_clientes_fieis_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "limite",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "description": "Quantos clientes",
              "examples": [10],
              "default": 10,
              "title": "Limite"
            },
            "description": "Quantos clientes"
          }
        ],
        "responses": {
          "200": {
            "description": "Clientes ordenados por total gasto com nível de fidelidade",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/RelatorioClienteFiel"
                  },
                  "title": "Response Clientes Fieis Relatorios Clientes Fieis Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/clientes/inativos": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Clientes inativos",
        "description": "Clientes sem compras há X dias",
        "operationId": "clientes_inativos_relatorios_clientes_inativos_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "dias",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "description": "Dias sem comprar",
              "examples": [90],
              "default": 90,
              "title": "Dias"
            },
            "description": "Dias sem comprar"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/RelatorioClienteInativo"
                  },
                  "title": "Response Clientes Inativos Relatorios Clientes Inativos Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/produtos/mais-vendidos": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Top produtos mais vendidos",
        "operationId": "produtos_mais_vendidos_relatorios_produtos_mais_vendidos_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "limite",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "description": "Quantos produtos",
              "examples": [10],
              "default": 10,
              "title": "Limite"
            },
            "description": "Quantos produtos"
          }
        ],
        "responses": {
          "200": {
            "description": "Produtos ordenados por quantidade vendida",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/RelatorioProdutoVendido"
                  },
                  "title": "Response Produtos Mais Vendidos Relatorios Produtos Mais Vendidos Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/vendas/por-cliente": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Vendas agregadas por cliente",
        "operationId": "vendas_por_cliente_relatorios_vendas_por_cliente_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "limite",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "description": "Quantos clientes",
              "examples": [10],
              "default": 10,
              "title": "Limite"
            },
            "description": "Quantos clientes"
          }
        ],
        "responses": {
          "200": {
            "description": "Total de compras, gasto e ticket médio por cliente",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/RelatorioVendaCliente"
                  },
                  "title": "Response Vendas Por Cliente Relatorios Vendas Por Cliente Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/relatorios/stock/baixo": {
      "get": {
        "tags": [
          "Relatórios"
        ],
        "summary": "Produtos com stock crítico",
        "operationId": "stock_baixo_relatorios_stock_baixo_get",
        "responses": {
          "200": {
            "description": "Produtos abaixo do stock mínimo com quantidade em falta",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/ProdutoStockBaixo"
                  },
                  "type": "array",
                  "title": "Response Stock Baixo Relatorios Stock Baixo Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/prestacoes": {
      "get": {
        "tags": [
          "Prestações"
        ],
        "summary": "Listar todos os planos de prestações",
        "description": "Retorna todos os planos de prestações registados, ordenados do mais recente para o mais antigo.",
        "operationId": "listar_prestacoes_get",
        "responses": {
          "200": {
            "description": "Lista de planos de prestações com situação, saldo e parcelas",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/PrestacaoResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Prestacoes Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      },
      "post": {
        "tags": [
          "Prestações"
        ],
        "summary": "Criar plano de prestações para uma venda",
        "description": "Vincula uma venda existente a um plano de pagamento parcelado. Gera automaticamente as parcelas com vencimento mensal a partir da data atual.",
        "operationId": "criar_prestacoes_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PrestacaoCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Plano de prestações criado com parcelas geradas, saldo total e situação PENDENTE",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PrestacaoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/prestacoes/{id}": {
      "get": {
        "tags": [
          "Prestações"
        ],
        "summary": "Detalhes de um plano de prestações",
        "description": "Obtém os detalhes completos de um plano, incluindo todas as parcelas, pagamentos e saldo atual.",
        "operationId": "buscar_prestacoes__id__get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Plano de prestações com parcelas, valores pagos e saldo devedor",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PrestacaoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/prestacoes/{id}/pagamentos": {
      "post": {
        "tags": [
          "Prestações"
        ],
        "summary": "Registar pagamento de uma prestação",
        "description": "Regista um pagamento parcial ou total para um plano. Atualiza o saldo e altera a situação para PARCIAL, PAGO ou ATRASADO conforme o caso.",
        "operationId": "pagar_prestacoes__id__pagamentos_post",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PagamentoCreate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Plano atualizado com o novo saldo e situação após o pagamento",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PrestacaoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/prestacoes/clientes/{cliente_id}/dividas": {
      "get": {
        "tags": [
          "Prestações"
        ],
        "summary": "Dívidas de um cliente",
        "description": "Retorna o resumo de todas as prestações em aberto de um cliente (PENDENTE, PARCIAL ou ATRASADO), com saldo total e lista detalhada.",
        "operationId": "dividas_cliente_prestacoes_clientes__cliente_id__dividas_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "cliente_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid",
              "title": "Cliente Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Resumo de dívidas do cliente com saldo aberto e lista de prestações pendentes",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ClienteDividaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/fluxo-caixa/lancamentos": {
      "post": {
        "tags": [
          "Fluxo de Caixa"
        ],
        "summary": "Registar lançamento manual",
        "description": "Regista uma entrada ou saída manual (salário, renda, energia, etc.)",
        "operationId": "criar_lancamento_fluxo_caixa_lancamentos_post",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LancamentoCreate"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Lançamento criado com tipo, valor, categoria e data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LancamentoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Fluxo de Caixa"
        ],
        "summary": "Extrato de fluxo de caixa",
        "description": "Lista lançamentos com filtros opcionais por período e categoria. Retorna totais de entradas, saídas e saldo do período.",
        "operationId": "listar_lancamentos_fluxo_caixa_lancamentos_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "data_inicio",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "date"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Data início",
              "examples": [
                "2026-06-01"
              ],
              "title": "Data Inicio"
            },
            "description": "Data início"
          },
          {
            "name": "data_fim",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "date"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Data fim",
              "examples": [
                "2026-06-30"
              ],
              "title": "Data Fim"
            },
            "description": "Data fim"
          },
          {
            "name": "categoria",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filtrar por categoria",
              "examples": [
                "VENDA",
                "SALARIO"
              ],
              "title": "Categoria"
            },
            "description": "Filtrar por categoria"
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de lançamentos com resumo de entradas, saídas e saldo",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LancamentoListaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/fluxo-caixa/saldo": {
      "get": {
        "tags": [
          "Fluxo de Caixa"
        ],
        "summary": "Saldo atual do caixa",
        "description": "Retorna o saldo atual com total de entradas e saídas acumuladas",
        "operationId": "saldo_fluxo_caixa_saldo_get",
        "responses": {
          "200": {
            "description": "Saldo atual, total de entradas e total de saídas",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SaldoResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/fluxo-caixa/demonstrativo": {
      "get": {
        "tags": [
          "Fluxo de Caixa"
        ],
        "summary": "Demonstrativo financeiro por período",
        "description": "Retorna entradas e saídas agrupadas por categoria num período, com saldo final",
        "operationId": "demonstrativo_fluxo_caixa_demonstrativo_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "data_inicio",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date",
              "description": "Data início",
              "examples": [
                "2026-01-01"
              ],
              "title": "Data Inicio"
            },
            "description": "Data início"
          },
          {
            "name": "data_fim",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date",
              "description": "Data fim",
              "examples": [
                "2026-12-31"
              ],
              "title": "Data Fim"
            },
            "description": "Data fim"
          }
        ],
        "responses": {
          "200": {
            "description": "Demonstrativo com totais por categoria e saldo final",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DemonstrativoResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/fluxo-caixa/sync": {
      "post": {
        "tags": [
          "Fluxo de Caixa"
        ],
        "summary": "Sincronizar histórico para fluxo de caixa",
        "description": "Importa vendas, pagamentos de prestações e compras de stock já existentes como lançamentos de caixa. Não duplica lançamentos já sincronizados.",
        "operationId": "sincronizar_fluxo_caixa_sync_post",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "data_inicio",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "date"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Sincronizar a partir desta data",
              "examples": [
                "2026-01-01"
              ],
              "title": "Data Inicio"
            },
            "description": "Sincronizar a partir desta data"
          },
          {
            "name": "data_fim",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "date"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Sincronizar até esta data",
              "examples": [
                "2026-12-31"
              ],
              "title": "Data Fim"
            },
            "description": "Sincronizar até esta data"
          }
        ],
        "responses": {
          "200": {
            "description": "Total de lançamentos criados na sincronização",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SyncResult"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/ia/sessoes": {
      "get": {
        "tags": [
          "Assistente IA"
        ],
        "summary": "Listar sessões",
        "description": "Lista todas as sessões de chat do gestor autenticado",
        "operationId": "listar_sessoes_ia_sessoes_get",
        "responses": {
          "200": {
            "description": "Lista de sessões ordenadas por data descendente",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/SessaoIaResponse"
                  },
                  "type": "array",
                  "title": "Response Listar Sessoes Ia Sessoes Get"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      },
      "post": {
        "tags": [
          "Assistente IA"
        ],
        "summary": "Criar sessão de chat",
        "description": "Cria uma nova sessão de conversa com o assistente IA",
        "operationId": "criar_sessao_ia_sessoes_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SessaoIaCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Sessão criada",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SessaoIaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/ia/sessoes/{sessao_id}/mensagens": {
      "get": {
        "tags": [
          "Assistente IA"
        ],
        "summary": "Histórico da sessão",
        "description": "Obtém todas as mensagens de uma sessão de chat",
        "operationId": "listar_mensagens_ia_sessoes__sessao_id__mensagens_get",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "sessao_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Sessao Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de mensagens ordenadas por data",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/MensagemIaResponse"
                  },
                  "title": "Response Listar Mensagens Ia Sessoes  Sessao Id  Mensagens Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/ia/sessoes/{sessao_id}/perguntar": {
      "post": {
        "tags": [
          "Assistente IA"
        ],
        "summary": "Fazer pergunta ao assistente",
        "description": "Envia uma pergunta para o assistente IA. O assistente pode consultar dados de vendas, stock, fluxo de caixa, clientes e prestações para responder.",
        "operationId": "perguntar_ia_sessoes__sessao_id__perguntar_post",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "sessao_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Sessao Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PerguntaRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Resposta do assistente IA",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PerguntaResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/ia/sessoes/{sessao_id}": {
      "delete": {
        "tags": [
          "Assistente IA"
        ],
        "summary": "Apagar sessão",
        "description": "Apaga uma sessão e todas as suas mensagens",
        "operationId": "apagar_sessao_ia_sessoes__sessao_id__delete",
        "security": [
          {
            "HTTPBearer": []
          }
        ],
        "parameters": [
          {
            "name": "sessao_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Sessao Id"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Sessão apagada"
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/health": {
      "get": {
        "summary": "Health",
        "operationId": "health_health_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      }
    },
    "/debug/users": {
      "get": {
        "summary": "Debug Users",
        "operationId": "debug_users_debug_users_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "CategoriaGrupoResponse": {
        "properties": {
          "categoria": {
            "type": "string",
            "title": "Categoria"
          },
          "total": {
            "type": "number",
            "title": "Total"
          },
          "quantidade": {
            "type": "integer",
            "title": "Quantidade"
          }
        },
        "type": "object",
        "required": [
          "categoria",
          "total",
          "quantidade"
        ],
        "title": "CategoriaGrupoResponse"
      },
      "ClienteCreate": {
        "properties": {
          "nome": {
            "type": "string",
            "title": "Nome",
            "description": "Nome do cliente",
            "examples": [
              "João dos Santos"
            ]
          },
          "telefone": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Telefone",
            "description": "Telefone",
            "examples": [
              "923456789"
            ]
          },
          "email": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Email",
            "description": "Email",
            "examples": [
              "joao@email.com"
            ]
          },
          "nif": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Nif",
            "description": "NIF",
            "examples": [
              "123456789"
            ]
          },
          "endereco": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Endereco",
            "description": "Endereço"
          }
        },
        "type": "object",
        "required": [
          "nome"
        ],
        "title": "ClienteCreate"
      },
      "ClienteDividaResponse": {
        "properties": {
          "cliente_id": {
            "type": "string",
            "format": "uuid",
            "title": "Cliente Id",
            "examples": [
              "af11fa27-2bbe-4834-acb3-4a249c0f5ce4"
            ]
          },
          "cliente_nome": {
            "type": "string",
            "title": "Cliente Nome",
            "examples": [
              "Ana Cristina"
            ]
          },
          "total_dividas": {
            "type": "integer",
            "title": "Total Dividas",
            "description": "Total de prestações em aberto",
            "examples": [2]
          },
          "valor_total_devido": {
            "type": "number",
            "title": "Valor Total Devido",
            "description": "Soma total das dívidas",
            "examples": [300000]
          },
          "valor_total_pago": {
            "type": "number",
            "title": "Valor Total Pago",
            "description": "Total já pago",
            "examples": [100000]
          },
          "saldo_aberto": {
            "type": "number",
            "title": "Saldo Aberto",
            "description": "Saldo pendente total",
            "examples": [200000]
          },
          "prestacoes": {
            "items": {
              "$ref": "#/components/schemas/PrestacaoResponse"
            },
            "type": "array",
            "title": "Prestacoes",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "cliente_id",
          "cliente_nome",
          "total_dividas",
          "valor_total_devido",
          "valor_total_pago",
          "saldo_aberto"
        ],
        "title": "ClienteDividaResponse",
        "example": {
          "cliente_id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
          "cliente_nome": "Ana Cristina",
          "prestacoes": [
            {
              "cliente_id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
              "cliente_nome": "Ana Cristina",
              "criado_em": "2026-06-27T14:30:00Z",
              "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
              "numero_prestacoes": 6,
              "pagamentos": [
                {
                  "data_pagamento": "2026-07-01T14:30:00Z",
                  "data_vencimento": "2026-07-01T00:00:00Z",
                  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                  "pago": true,
                  "valor": 25000
                }
              ],
              "saldo": 100000,
              "situacao": "PARCIAL",
              "valor_pago": 50000,
              "valor_total": 150000,
              "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
            }
          ],
          "saldo_aberto": 200000,
          "total_dividas": 2,
          "valor_total_devido": 300000,
          "valor_total_pago": 100000
        }
      },
      "ClienteResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "nome": {
            "type": "string",
            "title": "Nome"
          },
          "telefone": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Telefone"
          },
          "email": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Email"
          },
          "nif": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Nif"
          },
          "endereco": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Endereco"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "nome",
          "telefone",
          "email",
          "nif",
          "endereco",
          "criado_em"
        ],
        "title": "ClienteResponse"
      },
      "ClienteUpdate": {
        "properties": {
          "nome": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Nome"
          },
          "telefone": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Telefone"
          },
          "email": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Email"
          },
          "nif": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Nif"
          },
          "endereco": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Endereco"
          }
        },
        "type": "object",
        "title": "ClienteUpdate"
      },
      "DemonstrativoResponse": {
        "properties": {
          "data_inicio": {
            "type": "string",
            "format": "date",
            "title": "Data Inicio"
          },
          "data_fim": {
            "type": "string",
            "format": "date",
            "title": "Data Fim"
          },
          "total_entradas": {
            "type": "number",
            "title": "Total Entradas"
          },
          "total_saidas": {
            "type": "number",
            "title": "Total Saidas"
          },
          "saldo_final": {
            "type": "number",
            "title": "Saldo Final"
          },
          "entradas": {
            "items": {
              "$ref": "#/components/schemas/CategoriaGrupoResponse"
            },
            "type": "array",
            "title": "Entradas"
          },
          "saidas": {
            "items": {
              "$ref": "#/components/schemas/CategoriaGrupoResponse"
            },
            "type": "array",
            "title": "Saidas"
          }
        },
        "type": "object",
        "required": [
          "data_inicio",
          "data_fim",
          "total_entradas",
          "total_saidas",
          "saldo_final",
          "entradas",
          "saidas"
        ],
        "title": "DemonstrativoResponse",
        "example": {
          "data_fim": "2026-06-30",
          "data_inicio": "2026-06-01",
          "entradas": [
            {
              "categoria": "VENDA",
              "quantidade": 15,
              "total": 500000
            },
            {
              "categoria": "RECEBIMENTO_PRESTACAO",
              "quantidade": 4,
              "total": 200000
            }
          ],
          "saidas": [
            {
              "categoria": "SALARIO",
              "quantidade": 1,
              "total": 250000
            },
            {
              "categoria": "RENDA",
              "quantidade": 1,
              "total": 100000
            },
            {
              "categoria": "ENERGIA",
              "quantidade": 1,
              "total": 50000
            },
            {
              "categoria": "COMPRA_STOCK",
              "quantidade": 3,
              "total": 150000
            }
          ],
          "saldo_final": 150000,
          "total_entradas": 700000,
          "total_saidas": 550000
        }
      },
      "HTTPValidationError": {
        "properties": {
          "detail": {
            "items": {
              "$ref": "#/components/schemas/ValidationError"
            },
            "type": "array",
            "title": "Detail"
          }
        },
        "type": "object",
        "title": "HTTPValidationError"
      },
      "ItemVendaInput": {
        "properties": {
          "produto_id": {
            "type": "string",
            "format": "uuid",
            "title": "Produto Id",
            "description": "ID do produto"
          },
          "quantidade": {
            "type": "integer",
            "minimum": 1,
            "title": "Quantidade",
            "description": "Quantidade",
            "examples": [2]
          }
        },
        "type": "object",
        "required": [
          "produto_id",
          "quantidade"
        ],
        "title": "ItemVendaInput"
      },
      "LancamentoCreate": {
        "properties": {
          "data_movimento": {
            "type": "string",
            "format": "date",
            "title": "Data Movimento",
            "description": "Data do movimento",
            "examples": [
              "2026-06-01"
            ]
          },
          "descricao": {
            "type": "string",
            "minLength": 1,
            "title": "Descricao",
            "description": "Descrição do lançamento",
            "examples": [
              "Venda produto"
            ]
          },
          "tipo": {
            "type": "string",
            "title": "Tipo",
            "description": "ENTRADA ou SAIDA",
            "examples": [
              "ENTRADA"
            ]
          },
          "valor": {
            "type": "number",
            "exclusiveMinimum": 0,
            "title": "Valor",
            "description": "Valor do movimento",
            "examples": [100000]
          },
          "categoria": {
            "type": "string",
            "title": "Categoria",
            "description": "Categoria do lançamento",
            "examples": [
              "VENDA",
              "SALARIO",
              "RENDA",
              "ENERGIA",
              "COMPRA_STOCK"
            ]
          }
        },
        "type": "object",
        "required": [
          "data_movimento",
          "descricao",
          "tipo",
          "valor",
          "categoria"
        ],
        "title": "LancamentoCreate",
        "example": {
          "categoria": "VENDA",
          "data_movimento": "2026-06-01",
          "descricao": "Venda produto",
          "tipo": "ENTRADA",
          "valor": 100000
        }
      },
      "LancamentoListaResponse": {
        "properties": {
          "total_lancamentos": {
            "type": "integer",
            "title": "Total Lancamentos"
          },
          "total_entradas": {
            "type": "number",
            "title": "Total Entradas"
          },
          "total_saidas": {
            "type": "number",
            "title": "Total Saidas"
          },
          "saldo_periodo": {
            "type": "number",
            "title": "Saldo Periodo"
          },
          "lancamentos": {
            "items": {
              "$ref": "#/components/schemas/LancamentoResponse"
            },
            "type": "array",
            "title": "Lancamentos"
          }
        },
        "type": "object",
        "required": [
          "total_lancamentos",
          "total_entradas",
          "total_saidas",
          "saldo_periodo",
          "lancamentos"
        ],
        "title": "LancamentoListaResponse",
        "example": {
          "lancamentos": [
            {
              "categoria": "VENDA",
              "criado_em": "2026-06-01T10:00:00Z",
              "data_movimento": "2026-06-01",
              "descricao": "Venda produto",
              "id": "uuid",
              "tipo": "ENTRADA",
              "valor": 500000
            }
          ],
          "saldo_periodo": 250000,
          "total_entradas": 500000,
          "total_lancamentos": 2,
          "total_saidas": 250000
        }
      },
      "LancamentoResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "data_movimento": {
            "type": "string",
            "format": "date",
            "title": "Data Movimento"
          },
          "descricao": {
            "type": "string",
            "title": "Descricao"
          },
          "tipo": {
            "type": "string",
            "title": "Tipo"
          },
          "valor": {
            "type": "number",
            "title": "Valor"
          },
          "categoria": {
            "type": "string",
            "title": "Categoria"
          },
          "venda_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid"
              },
              {
                "type": "null"
              }
            ],
            "title": "Venda Id"
          },
          "prestacao_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid"
              },
              {
                "type": "null"
              }
            ],
            "title": "Prestacao Id"
          },
          "pagamento_prestacao_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid"
              },
              {
                "type": "null"
              }
            ],
            "title": "Pagamento Prestacao Id"
          },
          "movimento_stock_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid"
              },
              {
                "type": "null"
              }
            ],
            "title": "Movimento Stock Id"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "data_movimento",
          "descricao",
          "tipo",
          "valor",
          "categoria",
          "venda_id",
          "prestacao_id",
          "pagamento_prestacao_id",
          "movimento_stock_id",
          "criado_em"
        ],
        "title": "LancamentoResponse"
      },
      "LoginRequest": {
        "properties": {
          "email": {
            "type": "string",
            "title": "Email",
            "examples": [
              "admin@bisness.com"
            ]
          },
          "password": {
            "type": "string",
            "title": "Password",
            "examples": [
              "admin123"
            ]
          }
        },
        "type": "object",
        "required": [
          "email",
          "password"
        ],
        "title": "LoginRequest"
      },
      "MensagemIaResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "sessao_id": {
            "type": "string",
            "format": "uuid",
            "title": "Sessao Id"
          },
          "role": {
            "type": "string",
            "title": "Role"
          },
          "content": {
            "type": "string",
            "title": "Content"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "sessao_id",
          "role",
          "content",
          "criado_em"
        ],
        "title": "MensagemIaResponse",
        "example": {
          "content": "Qual foi o produto mais vendido este mês?",
          "criado_em": "2026-06-27T12:05:00Z",
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "role": "user",
          "sessao_id": "550e8400-e29b-41d4-a716-446655440000"
        }
      },
      "MovimentoCreate": {
        "properties": {
          "produto_id": {
            "type": "string",
            "format": "uuid",
            "title": "Produto Id",
            "description": "ID do produto"
          },
          "tipo": {
            "type": "string",
            "title": "Tipo",
            "description": "ENTRADA ou SAIDA",
            "examples": [
              "ENTRADA",
              "SAIDA"
            ]
          },
          "quantidade": {
            "type": "integer",
            "minimum": 1,
            "title": "Quantidade",
            "description": "Quantidade",
            "examples": [20]
          },
          "motivo": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Motivo",
            "description": "Motivo do movimento",
            "examples": [
              "Reposição de stock"
            ]
          },
          "preco_unitario": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "title": "Preco Unitario",
            "description": "Preço de custo (entrada)",
            "examples": [1500]
          }
        },
        "type": "object",
        "required": [
          "produto_id",
          "tipo",
          "quantidade"
        ],
        "title": "MovimentoCreate"
      },
      "MovimentoResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "produto_id": {
            "type": "string",
            "format": "uuid",
            "title": "Produto Id"
          },
          "produto_nome": {
            "type": "string",
            "title": "Produto Nome"
          },
          "tipo": {
            "type": "string",
            "title": "Tipo"
          },
          "quantidade": {
            "type": "integer",
            "title": "Quantidade"
          },
          "motivo": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Motivo"
          },
          "preco_unitario": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "title": "Preco Unitario"
          },
          "utilizador_nome": {
            "type": "string",
            "title": "Utilizador Nome"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "produto_id",
          "produto_nome",
          "tipo",
          "quantidade",
          "motivo",
          "preco_unitario",
          "utilizador_nome",
          "criado_em"
        ],
        "title": "MovimentoResponse"
      },
      "PagamentoCreate": {
        "properties": {
          "valor": {
            "type": "number",
            "exclusiveMinimum": 0,
            "title": "Valor",
            "description": "Valor do pagamento",
            "examples": [25000]
          },
          "data_pagamento": {
            "type": "string",
            "format": "date-time",
            "title": "Data Pagamento",
            "description": "Data do pagamento",
            "examples": [
              "2026-07-27T14:30:00Z"
            ]
          }
        },
        "type": "object",
        "required": [
          "valor",
          "data_pagamento"
        ],
        "title": "PagamentoCreate",
        "example": {
          "data_pagamento": "2026-07-27T14:30:00Z",
          "valor": 25000
        }
      },
      "PagamentoResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id",
            "examples": [
              "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            ]
          },
          "valor": {
            "type": "number",
            "title": "Valor",
            "examples": [25000]
          },
          "data_vencimento": {
            "type": "string",
            "format": "date-time",
            "title": "Data Vencimento",
            "examples": [
              "2026-07-01T00:00:00Z"
            ]
          },
          "data_pagamento": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ],
            "title": "Data Pagamento",
            "examples": [
              "2026-07-01T14:30:00Z"
            ]
          },
          "pago": {
            "type": "boolean",
            "title": "Pago",
            "examples": [true]
          }
        },
        "type": "object",
        "required": [
          "id",
          "valor",
          "data_vencimento",
          "data_pagamento",
          "pago"
        ],
        "title": "PagamentoResponse"
      },
      "PerguntaRequest": {
        "properties": {
          "mensagem": {
            "type": "string",
            "minLength": 1,
            "title": "Mensagem",
            "description": "Pergunta do gestor",
            "examples": [
              "Qual foi o produto mais vendido este mês?"
            ]
          }
        },
        "type": "object",
        "required": [
          "mensagem"
        ],
        "title": "PerguntaRequest",
        "example": {
          "mensagem": "Qual foi o produto mais vendido este mês?"
        }
      },
      "PerguntaResponse": {
        "properties": {
          "resposta": {
            "type": "string",
            "title": "Resposta"
          },
          "mensagem_id": {
            "type": "string",
            "format": "uuid",
            "title": "Mensagem Id"
          }
        },
        "type": "object",
        "required": [
          "resposta",
          "mensagem_id"
        ],
        "title": "PerguntaResponse",
        "example": {
          "mensagem_id": "550e8400-e29b-41d4-a716-446655440002",
          "resposta": "O produto mais vendido este mês foi a Coca-Cola 2L com 120 unidades."
        }
      },
      "PrestacaoCreate": {
        "properties": {
          "venda_id": {
            "type": "string",
            "format": "uuid",
            "title": "Venda Id",
            "description": "ID da venda",
            "examples": [
              "f47ac10b-58cc-4372-a567-0e02b2c3d479"
            ]
          },
          "numero_prestacoes": {
            "type": "integer",
            "maximum": 48,
            "minimum": 1,
            "title": "Numero Prestacoes",
            "description": "Número de prestações",
            "examples": [6]
          }
        },
        "type": "object",
        "required": [
          "venda_id",
          "numero_prestacoes"
        ],
        "title": "PrestacaoCreate",
        "example": {
          "numero_prestacoes": 6,
          "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        }
      },
      "PrestacaoResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id",
            "examples": [
              "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            ]
          },
          "venda_id": {
            "type": "string",
            "format": "uuid",
            "title": "Venda Id",
            "examples": [
              "f47ac10b-58cc-4372-a567-0e02b2c3d479"
            ]
          },
          "cliente_id": {
            "type": "string",
            "format": "uuid",
            "title": "Cliente Id",
            "examples": [
              "af11fa27-2bbe-4834-acb3-4a249c0f5ce4"
            ]
          },
          "cliente_nome": {
            "type": "string",
            "title": "Cliente Nome",
            "default": "",
            "examples": [
              "Ana Cristina"
            ]
          },
          "valor_total": {
            "type": "number",
            "title": "Valor Total",
            "examples": [150000]
          },
          "valor_pago": {
            "type": "number",
            "title": "Valor Pago",
            "examples": [50000]
          },
          "saldo": {
            "type": "number",
            "title": "Saldo",
            "description": "Valor em aberto",
            "examples": [100000]
          },
          "numero_prestacoes": {
            "type": "integer",
            "title": "Numero Prestacoes",
            "examples": [6]
          },
          "situacao": {
            "type": "string",
            "title": "Situacao",
            "examples": [
              "PARCIAL"
            ]
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em",
            "examples": [
              "2026-06-27T14:30:00Z"
            ]
          },
          "pagamentos": {
            "items": {
              "$ref": "#/components/schemas/PagamentoResponse"
            },
            "type": "array",
            "title": "Pagamentos",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "id",
          "venda_id",
          "cliente_id",
          "valor_total",
          "valor_pago",
          "saldo",
          "numero_prestacoes",
          "situacao",
          "criado_em"
        ],
        "title": "PrestacaoResponse",
        "example": {
          "cliente_id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
          "cliente_nome": "Ana Cristina",
          "criado_em": "2026-06-27T14:30:00Z",
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "numero_prestacoes": 6,
          "pagamentos": [
            {
              "data_pagamento": "2026-07-01T14:30:00Z",
              "data_vencimento": "2026-07-01T00:00:00Z",
              "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
              "pago": true,
              "valor": 25000
            },
            {
              "data_vencimento": "2026-08-01T00:00:00Z",
              "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
              "pago": false,
              "valor": 25000
            }
          ],
          "saldo": 100000,
          "situacao": "PARCIAL",
          "valor_pago": 50000,
          "valor_total": 150000,
          "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        }
      },
      "ProdutoCreate": {
        "properties": {
          "nome": {
            "type": "string",
            "title": "Nome",
            "description": "Nome do produto",
            "examples": [
              "Arroz Agulha 5kg"
            ]
          },
          "descricao": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Descricao",
            "description": "Descrição detalhada"
          },
          "codigo_barras": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Codigo Barras",
            "description": "Código de barras",
            "examples": [
              "7891234567890"
            ]
          },
          "preco_custo": {
            "type": "number",
            "title": "Preco Custo",
            "description": "Preço de compra (Kz)",
            "default": 0,
            "examples": [1500]
          },
          "preco_venda": {
            "type": "number",
            "title": "Preco Venda",
            "description": "Preço de venda (Kz)",
            "default": 0,
            "examples": [2500]
          },
          "iva": {
            "type": "number",
            "title": "Iva",
            "description": "Taxa de IVA (%)",
            "default": 14,
            "examples": [14]
          },
          "stock_atual": {
            "type": "integer",
            "title": "Stock Atual",
            "description": "Quantidade em stock",
            "default": 0,
            "examples": [50]
          },
          "stock_minimo": {
            "type": "integer",
            "title": "Stock Minimo",
            "description": "Stock mínimo para alerta",
            "default": 0,
            "examples": [10]
          }
        },
        "type": "object",
        "required": [
          "nome"
        ],
        "title": "ProdutoCreate"
      },
      "ProdutoResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "nome": {
            "type": "string",
            "title": "Nome"
          },
          "descricao": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Descricao"
          },
          "codigo_barras": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Codigo Barras"
          },
          "preco_custo": {
            "type": "number",
            "title": "Preco Custo"
          },
          "preco_venda": {
            "type": "number",
            "title": "Preco Venda"
          },
          "iva": {
            "type": "number",
            "title": "Iva"
          },
          "margem_lucro": {
            "type": "number",
            "title": "Margem Lucro",
            "description": "Margem de lucro (%)"
          },
          "preco_com_iva": {
            "type": "number",
            "title": "Preco Com Iva",
            "description": "Preço final com IVA"
          },
          "stock_atual": {
            "type": "integer",
            "title": "Stock Atual"
          },
          "stock_minimo": {
            "type": "integer",
            "title": "Stock Minimo"
          },
          "ativo": {
            "type": "boolean",
            "title": "Ativo"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "nome",
          "descricao",
          "codigo_barras",
          "preco_custo",
          "preco_venda",
          "iva",
          "margem_lucro",
          "preco_com_iva",
          "stock_atual",
          "stock_minimo",
          "ativo",
          "criado_em"
        ],
        "title": "ProdutoResponse"
      },
      "ProdutoStockBaixo": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "nome": {
            "type": "string",
            "title": "Nome"
          },
          "descricao": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Descricao"
          },
          "codigo_barras": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Codigo Barras"
          },
          "preco_custo": {
            "type": "number",
            "title": "Preco Custo"
          },
          "preco_venda": {
            "type": "number",
            "title": "Preco Venda"
          },
          "iva": {
            "type": "number",
            "title": "Iva"
          },
          "margem_lucro": {
            "type": "number",
            "title": "Margem Lucro",
            "description": "Margem de lucro (%)"
          },
          "preco_com_iva": {
            "type": "number",
            "title": "Preco Com Iva",
            "description": "Preço final com IVA"
          },
          "stock_atual": {
            "type": "integer",
            "title": "Stock Atual"
          },
          "stock_minimo": {
            "type": "integer",
            "title": "Stock Minimo"
          },
          "ativo": {
            "type": "boolean",
            "title": "Ativo"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          },
          "diferenca": {
            "type": "integer",
            "title": "Diferenca",
            "description": "Quantidade em falta"
          }
        },
        "type": "object",
        "required": [
          "id",
          "nome",
          "descricao",
          "codigo_barras",
          "preco_custo",
          "preco_venda",
          "iva",
          "margem_lucro",
          "preco_com_iva",
          "stock_atual",
          "stock_minimo",
          "ativo",
          "criado_em",
          "diferenca"
        ],
        "title": "ProdutoStockBaixo"
      },
      "ProdutoUpdate": {
        "properties": {
          "nome": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Nome"
          },
          "descricao": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Descricao"
          },
          "codigo_barras": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Codigo Barras"
          },
          "preco_custo": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "title": "Preco Custo"
          },
          "preco_venda": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "title": "Preco Venda"
          },
          "iva": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "title": "Iva"
          },
          "stock_minimo": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Stock Minimo"
          }
        },
        "type": "object",
        "title": "ProdutoUpdate"
      },
      "RegisterRequest": {
        "properties": {
          "nome": {
            "type": "string",
            "title": "Nome",
            "description": "Nome completo",
            "examples": [
              "Maria Silva"
            ]
          },
          "email": {
            "type": "string",
            "title": "Email",
            "description": "Email de acesso",
            "examples": [
              "maria@bisness.com"
            ]
          },
          "password": {
            "type": "string",
            "title": "Password",
            "description": "Password de acesso",
            "examples": [
              "123456"
            ]
          },
          "role": {
            "type": "string",
            "title": "Role",
            "description": "Role do utilizador",
            "default": "OPERADOR",
            "examples": [
              "OPERADOR",
              "GESTOR"
            ]
          }
        },
        "type": "object",
        "required": [
          "nome",
          "email",
          "password"
        ],
        "title": "RegisterRequest"
      },
      "RelatorioClienteFiel": {
        "properties": {
          "cliente_id": {
            "type": "string",
            "format": "uuid",
            "title": "Cliente Id",
            "examples": [
              "af11fa27-2bbe-4834-acb3-4a249c0f5ce4"
            ]
          },
          "cliente_nome": {
            "type": "string",
            "title": "Cliente Nome",
            "examples": [
              "Ana Cristina"
            ]
          },
          "total_vendas": {
            "type": "integer",
            "title": "Total Vendas",
            "examples": [22]
          },
          "total_gasto": {
            "type": "number",
            "title": "Total Gasto",
            "examples": [228000]
          },
          "nivel": {
            "type": "string",
            "title": "Nivel",
            "description": "BRONZE/PRATA/OURO",
            "examples": [
              "OURO"
            ]
          },
          "ultima_compra": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ],
            "title": "Ultima Compra",
            "examples": [
              "2026-06-27T14:30:00Z"
            ]
          },
          "media_por_venda": {
            "type": "number",
            "title": "Media Por Venda",
            "examples": [10363.64]
          }
        },
        "type": "object",
        "required": [
          "cliente_id",
          "cliente_nome",
          "total_vendas",
          "total_gasto",
          "nivel",
          "ultima_compra",
          "media_por_venda"
        ],
        "title": "RelatorioClienteFiel",
        "example": {
          "cliente_id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
          "cliente_nome": "Ana Cristina",
          "media_por_venda": 10363.64,
          "nivel": "OURO",
          "total_gasto": 228000,
          "total_vendas": 22,
          "ultima_compra": "2026-06-27T14:30:00Z"
        }
      },
      "RelatorioClienteInativo": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id",
            "examples": [
              "af11fa27-2bbe-4834-acb3-4a249c0f5ce4"
            ]
          },
          "nome": {
            "type": "string",
            "title": "Nome",
            "examples": [
              "Carlos Filipe"
            ]
          },
          "telefone": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Telefone",
            "examples": [
              "999888777"
            ]
          },
          "email": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Email",
            "examples": [
              "carlos@email.com"
            ]
          }
        },
        "type": "object",
        "required": [
          "id",
          "nome",
          "telefone",
          "email"
        ],
        "title": "RelatorioClienteInativo",
        "example": {
          "email": "carlos@email.com",
          "id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
          "nome": "Carlos Filipe",
          "telefone": "999888777"
        }
      },
      "RelatorioProdutoVendido": {
        "properties": {
          "produto_id": {
            "type": "string",
            "format": "uuid",
            "title": "Produto Id",
            "examples": [
              "1edca05e-c4e7-490f-a90a-164a28ade8ad"
            ]
          },
          "produto_nome": {
            "type": "string",
            "title": "Produto Nome",
            "examples": [
              "Arroz Agulha 5kg"
            ]
          },
          "quantidade_vendida": {
            "type": "integer",
            "title": "Quantidade Vendida",
            "examples": [120]
          },
          "total_receita": {
            "type": "number",
            "title": "Total Receita",
            "examples": [384000]
          }
        },
        "type": "object",
        "required": [
          "produto_id",
          "produto_nome",
          "quantidade_vendida",
          "total_receita"
        ],
        "title": "RelatorioProdutoVendido",
        "example": {
          "produto_id": "1edca05e-c4e7-490f-a90a-164a28ade8ad",
          "produto_nome": "Arroz Agulha 5kg",
          "quantidade_vendida": 120,
          "total_receita": 384000
        }
      },
      "RelatorioVendaCliente": {
        "properties": {
          "cliente_id": {
            "type": "string",
            "format": "uuid",
            "title": "Cliente Id",
            "examples": [
              "af11fa27-2bbe-4834-acb3-4a249c0f5ce4"
            ]
          },
          "cliente_nome": {
            "type": "string",
            "title": "Cliente Nome",
            "examples": [
              "Ana Cristina"
            ]
          },
          "total_compras": {
            "type": "integer",
            "title": "Total Compras",
            "examples": [22]
          },
          "total_gasto": {
            "type": "number",
            "title": "Total Gasto",
            "examples": [228000]
          },
          "media_por_venda": {
            "type": "number",
            "title": "Media Por Venda",
            "examples": [10363.64]
          }
        },
        "type": "object",
        "required": [
          "cliente_id",
          "cliente_nome",
          "total_compras",
          "total_gasto",
          "media_por_venda"
        ],
        "title": "RelatorioVendaCliente",
        "example": {
          "cliente_id": "af11fa27-2bbe-4834-acb3-4a249c0f5ce4",
          "cliente_nome": "Ana Cristina",
          "media_por_venda": 10363.64,
          "total_compras": 22,
          "total_gasto": 228000
        }
      },
      "RelatorioVendasPeriodo": {
        "properties": {
          "total_vendas": {
            "type": "integer",
            "title": "Total Vendas",
            "examples": [42]
          },
          "total_receita": {
            "type": "number",
            "title": "Total Receita",
            "examples": [158000.5]
          },
          "total_sem_iva": {
            "type": "number",
            "title": "Total Sem Iva",
            "examples": [120000]
          },
          "total_iva": {
            "type": "number",
            "title": "Total Iva",
            "examples": [28800]
          },
          "total_descontos": {
            "type": "number",
            "title": "Total Descontos",
            "examples": [5200]
          },
          "lucro_bruto": {
            "type": "number",
            "title": "Lucro Bruto",
            "examples": [45000]
          },
          "ticket_medio": {
            "type": "number",
            "title": "Ticket Medio",
            "description": "Valor médio por venda",
            "examples": [3761.92]
          }
        },
        "type": "object",
        "required": [
          "total_vendas",
          "total_receita",
          "total_sem_iva",
          "total_iva",
          "total_descontos",
          "lucro_bruto",
          "ticket_medio"
        ],
        "title": "RelatorioVendasPeriodo",
        "example": {
          "lucro_bruto": 45000,
          "ticket_medio": 3761.92,
          "total_descontos": 5200,
          "total_iva": 28800,
          "total_receita": 158000.5,
          "total_sem_iva": 120000,
          "total_vendas": 42
        }
      },
      "SaldoResponse": {
        "properties": {
          "saldo_atual": {
            "type": "number",
            "title": "Saldo Atual"
          },
          "total_entradas": {
            "type": "number",
            "title": "Total Entradas"
          },
          "total_saidas": {
            "type": "number",
            "title": "Total Saidas"
          }
        },
        "type": "object",
        "required": [
          "saldo_atual",
          "total_entradas",
          "total_saidas"
        ],
        "title": "SaldoResponse",
        "example": {
          "saldo_atual": 150000,
          "total_entradas": 700000,
          "total_saidas": 550000
        }
      },
      "SessaoIaCreate": {
        "properties": {
          "titulo": {
            "type": "string",
            "maxLength": 255,
            "minLength": 1,
            "title": "Titulo",
            "description": "Título da sessão",
            "examples": [
              "Análise de vendas junho"
            ]
          }
        },
        "type": "object",
        "required": [
          "titulo"
        ],
        "title": "SessaoIaCreate",
        "example": {
          "titulo": "Análise de vendas junho"
        }
      },
      "SessaoIaResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "titulo": {
            "type": "string",
            "title": "Titulo"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          }
        },
        "type": "object",
        "required": [
          "id",
          "titulo",
          "criado_em"
        ],
        "title": "SessaoIaResponse",
        "example": {
          "criado_em": "2026-06-27T12:00:00Z",
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "titulo": "Análise de vendas junho"
        }
      },
      "SyncResult": {
        "properties": {
          "total_sincronizados": {
            "type": "integer",
            "title": "Total Sincronizados"
          },
          "sincronizados": {
            "type": "object",
            "title": "Sincronizados"
          },
          "data_inicio": {
            "anyOf": [
              {
                "type": "string",
                "format": "date"
              },
              {
                "type": "null"
              }
            ],
            "title": "Data Inicio"
          },
          "data_fim": {
            "anyOf": [
              {
                "type": "string",
                "format": "date"
              },
              {
                "type": "null"
              }
            ],
            "title": "Data Fim"
          }
        },
        "type": "object",
        "required": [
          "total_sincronizados",
          "sincronizados"
        ],
        "title": "SyncResult",
        "example": {
          "data_fim": "2026-06-30",
          "data_inicio": "2026-01-01",
          "sincronizados": {
            "compras_stock": 3,
            "pagamentos_prestacao": 12,
            "vendas": 30
          },
          "total_sincronizados": 45
        }
      },
      "TokenResponse": {
        "properties": {
          "access_token": {
            "type": "string",
            "title": "Access Token",
            "description": "Token JWT para autenticação"
          },
          "token_type": {
            "type": "string",
            "title": "Token Type",
            "default": "bearer"
          },
          "nome": {
            "type": "string",
            "title": "Nome",
            "description": "Nome do utilizador"
          },
          "role": {
            "type": "string",
            "title": "Role",
            "description": "Role do utilizador"
          }
        },
        "type": "object",
        "required": [
          "access_token",
          "nome",
          "role"
        ],
        "title": "TokenResponse"
      },
      "UtilizadorResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "nome": {
            "type": "string",
            "title": "Nome"
          },
          "email": {
            "type": "string",
            "title": "Email"
          },
          "role": {
            "type": "string",
            "title": "Role"
          },
          "ativo": {
            "type": "boolean",
            "title": "Ativo"
          }
        },
        "type": "object",
        "required": [
          "id",
          "nome",
          "email",
          "role",
          "ativo"
        ],
        "title": "UtilizadorResponse"
      },
      "ValidationError": {
        "properties": {
          "loc": {
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "integer"
                }
              ]
            },
            "type": "array",
            "title": "Location"
          },
          "msg": {
            "type": "string",
            "title": "Message"
          },
          "type": {
            "type": "string",
            "title": "Error Type"
          }
        },
        "type": "object",
        "required": [
          "loc",
          "msg",
          "type"
        ],
        "title": "ValidationError"
      },
      "VendaCreate": {
        "properties": {
          "cliente_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid"
              },
              {
                "type": "null"
              }
            ],
            "title": "Cliente Id",
            "description": "ID do cliente existente"
          },
          "cliente": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Cliente",
            "description": "Dados do novo cliente (se não existir)",
            "examples": [
              {
                "nome": "João",
                "telefone": "923456789"
              }
            ]
          },
          "itens": {
            "items": {
              "$ref": "#/components/schemas/ItemVendaInput"
            },
            "type": "array",
            "minItems": 1,
            "title": "Itens",
            "description": "Itens da venda"
          }
        },
        "type": "object",
        "required": [
          "itens"
        ],
        "title": "VendaCreate"
      },
      "VendaItemResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "produto_id": {
            "type": "string",
            "format": "uuid",
            "title": "Produto Id"
          },
          "produto_nome": {
            "type": "string",
            "title": "Produto Nome"
          },
          "quantidade": {
            "type": "integer",
            "title": "Quantidade"
          },
          "preco_unitario": {
            "type": "number",
            "title": "Preco Unitario",
            "description": "Preço de venda unitário no momento da venda"
          },
          "preco_custo_unitario": {
            "type": "number",
            "title": "Preco Custo Unitario",
            "description": "Preço de custo unitário no momento da venda"
          },
          "iva_aplicado": {
            "type": "number",
            "title": "Iva Aplicado",
            "description": "IVA (%) aplicado"
          },
          "subtotal": {
            "type": "number",
            "title": "Subtotal",
            "description": "Subtotal (preço × quantidade)"
          }
        },
        "type": "object",
        "required": [
          "id",
          "produto_id",
          "produto_nome",
          "quantidade",
          "preco_unitario",
          "preco_custo_unitario",
          "iva_aplicado",
          "subtotal"
        ],
        "title": "VendaItemResponse"
      },
      "VendaResponse": {
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "title": "Id"
          },
          "cliente_id": {
            "type": "string",
            "format": "uuid",
            "title": "Cliente Id"
          },
          "cliente_nome": {
            "type": "string",
            "title": "Cliente Nome"
          },
          "utilizador_nome": {
            "type": "string",
            "title": "Utilizador Nome"
          },
          "total_sem_iva": {
            "type": "number",
            "title": "Total Sem Iva",
            "description": "Total antes do IVA"
          },
          "total_iva": {
            "type": "number",
            "title": "Total Iva",
            "description": "Valor total do IVA"
          },
          "total_com_iva": {
            "type": "number",
            "title": "Total Com Iva",
            "description": "Total com IVA antes do desconto"
          },
          "desconto_percentual": {
            "type": "number",
            "title": "Desconto Percentual",
            "description": "Desconto aplicado (%)"
          },
          "total_desconto": {
            "type": "number",
            "title": "Total Desconto",
            "description": "Valor do desconto"
          },
          "total_final": {
            "type": "number",
            "title": "Total Final",
            "description": "Total a pagar"
          },
          "criado_em": {
            "type": "string",
            "format": "date-time",
            "title": "Criado Em"
          },
          "itens": {
            "items": {
              "$ref": "#/components/schemas/VendaItemResponse"
            },
            "type": "array",
            "title": "Itens"
          }
        },
        "type": "object",
        "required": [
          "id",
          "cliente_id",
          "cliente_nome",
          "utilizador_nome",
          "total_sem_iva",
          "total_iva",
          "total_com_iva",
          "desconto_percentual",
          "total_desconto",
          "total_final",
          "criado_em",
          "itens"
        ],
        "title": "VendaResponse"
      }
    },
    "securitySchemes": {
      "HTTPBearer": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
}
