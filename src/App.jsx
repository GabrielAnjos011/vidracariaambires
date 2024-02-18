import { useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./App.css";

const PDFGenerator = () => {
  const [customerData, setCustomerData] = useState({
    name: "",
    cnpj: "",
    phone: "",
  });
  const [items, setItems] = useState([]);
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [observations, setObservations] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const [editingIndex, setEditingIndex] = useState(-1);

  const handleCustomerDataChange = (e) => {
    const { name, value } = e.target;
    setCustomerData({ ...customerData, [name]: value });
  };

  const handleItemNameChange = (e) => {
    setItemDescription(e.target.value);
  };

  const handleItemQuantityChange = (e) => {
    setItemQuantity(e.target.value);
  };

  const handleItemPriceChange = (e) => {
    setItemColor(e.target.value);
  };

  const handleObservationsChange = (e) => {
    setObservations(e.target.value);
  };

  const handleTotalAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    setTotalAmount(formatCurrency(value));
  };

  const formatCurrency = (value) => {
    const amount = parseFloat(value) / 100;
    return `R$ ${amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const formatPhone = (value) => {
    // Remove tudo o que não é dígito
    const phoneNumber = value.replace(/\D/g, "");

    // Verifica se o número tem 11 dígitos
    if (phoneNumber.length === 11) {
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    // Caso contrário, aplica a máscara padrão
    return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  const formatCnpjCpf = (value) => {
    // Remove tudo o que não é dígito
    const cnpjCpf = value.replace(/\D/g, "");

    // Verifica se o número tem 14 dígitos (CNPJ)
    if (cnpjCpf.length === 14) {
      return cnpjCpf.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    // Verifica se o número tem 11 dígitos (CPF)
    else if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    // Caso contrário, retorna o valor sem formatação
    return value;
  };

  const addItem = () => {
    const newItem = {
      description: itemDescription,
      quantity: parseInt(itemQuantity),
      color: itemColor,
    };
    setItems([...items, newItem]);
    clearInputs();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = date;

    // Header
    doc.setFillColor(0, 152, 219);
    doc.rect(0, 0, 210, 35, "F");
    doc.setFont("Montserrat", "bold"); // Define a família da fonte como 'helvetica' e o estilo como negrito
    doc.setFontSize(27);
    doc.setTextColor(255);
    doc.text("Vidraçaria Ambires", 18, 17);

    doc.setFont("Montserrat", "normal");
    // Data atual
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text(`Data: ${currentDate}`, 20, 25);

    // Dados fixos e dinâmicos
    doc.setTextColor(0);
    // Adicionar os dados fixos na coluna esquerda
    doc.text(`Nome: Daniel Ambires da Silva`, 20, 50);
    doc.text(`CNPJ: 43.244.454/0001-10`, 20, 60);
    doc.text(`Telefone: (11) 94705-8537`, 20, 70);

    if (customerData.name || customerData.cnpj || customerData.phone) {
      doc.setLineWidth(1); // Define a espessura da linha como 0.5
      doc.setDrawColor(204, 204, 204);
      doc.line(105, 45, 105, 75); // linha vertical
    }

    // Adicionar os dados dinâmicos na coluna direita
    {
      customerData.name ? doc.text(`Nome: ${customerData.name}`, 120, 50) : "";
    }
    {
      customerData.cnpj
        ? doc.text(`CNPJ/CPF: ${formatCnpjCpf(customerData.cnpj)}`, 120, 60)
        : "";
    }
    {
      customerData.phone
        ? doc.text(`Telefone: ${formatPhone(customerData.phone)}`, 120, 70)
        : "";
    }

    // Tabela de Itens
    const tableData = items.map((item) => [
      item.description,
      item.quantity,
      item.color,
    ]);
    doc.autoTable({
      startY: 90,
      head: [["Descrição", "Quantidade", "Cor"]],
      body: tableData,
    });

    // Rodapé
    doc.text(
      `Observações: ${observations}`,
      20,
      doc.autoTable.previous.finalY + 20
    );
    doc.text(
      `Valor Total: ${totalAmount}`,
      120,
      doc.autoTable.previous.finalY + 20
    );

    doc.save("orcamento.pdf");
  };

  const editItem = (index) => {
    const selectedItem = items[index];
    setItemDescription(selectedItem.description);
    setItemQuantity(selectedItem.quantity.toString());
    setItemColor(selectedItem.color);
    setEditingIndex(index);
  };

  const saveItem = () => {
    const updatedItems = [...items];
    updatedItems[editingIndex] = {
      description: itemDescription,
      quantity: parseInt(itemQuantity),
      color: itemColor,
    };
    setItems(updatedItems);
    clearInputs();
    setEditingIndex(-1); // Limpar o estado de edição
  };

  const cancelEdit = () => {
    clearInputs();
    setEditingIndex(-1);
  };

  const clearInputs = () => {
    setItemDescription("");
    setItemQuantity("");
    setItemColor("");
  };

  const deleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Vidraçaria Ambires</h1>
      </nav>
      <div className="container">
        <h2>Data do Orçamento</h2>
        <span>Ao não colocar a data vai como padrão a data de hoje!</span>
        <input type="date" value={date} onChange={handleDateChange} />
        <h2>Dados do Cliente</h2>
        <div>
          <label>Nome:</label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleCustomerDataChange}
          />
        </div>
        <div>
          <label>CNPJ ou CPF:</label>
          <input
            type="text"
            name="cnpj"
            maxLength={18}
            value={formatCnpjCpf(customerData.cnpj)}
            onChange={handleCustomerDataChange}
          />
        </div>
        <div>
          <label>Telefone:</label>
          <input
            type="tel"
            name="phone"
            maxLength={15}
            value={formatPhone(customerData.phone)}
            onChange={handleCustomerDataChange}
          />
        </div>
        <h2>Itens do Orçamento</h2>
        <div>
          <textarea
            className="textareaDescription"
            placeholder="Descrição"
            value={itemDescription}
            onChange={handleItemNameChange}
          ></textarea>
          <input
            type="number"
            placeholder="Quantidade"
            value={itemQuantity}
            onChange={handleItemQuantityChange}
          />
          <input
            type="text"
            placeholder="Cor"
            value={itemColor}
            onChange={handleItemPriceChange}
          />
          {editingIndex === -1 ? (
            <button className="button add" onClick={addItem}>
              Adicionar Item
            </button>
          ) : (
            <div className="box-confirm-edit">
              <button className="button save-edit" onClick={saveItem}>
                Salvar
              </button>
              <button className="button cancel-edit" onClick={cancelEdit}>
                Cancelar
              </button>
            </div>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Quantidade</th>
              <th>Cor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.color}</td>
                <td>
                  <div className="box-item-actions">
                    <button
                      className="button edit"
                      onClick={() => editItem(index)}
                    >
                      Editar
                    </button>
                    <button
                      className="button delete"
                      onClick={() => deleteItem(index)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="box-footer">
          <div className="box-footer-observation">
            <h2>Observações</h2>
            <textarea
              className="textareaFooterObservation"
              value={observations}
              onChange={handleObservationsChange}
            />
          </div>
          <div className="box-footer-totalAmount">
            <h2>Valor Total do Orçamento</h2>
            <input
              className="input-totalAmount"
              type="text"
              value={totalAmount}
              onChange={handleTotalAmountChange}
            />
          </div>
        </div>
        <button className="button generate-pdf" onClick={generatePDF}>
          Gerar PDF
        </button>
      </div>
    </div>
  );
};

export default PDFGenerator;
