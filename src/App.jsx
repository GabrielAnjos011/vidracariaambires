import { useState } from "react";
import { jsPDF } from "jspdf";
import { FaCheck, FaEdit, FaFilePdf, FaTrash } from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
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
  const [itemQuantity, setItemQuantity] = useState();
  const [itemColor, setItemColor] = useState("");
  const [observations, setObservations] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
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
    const value = e.target.value.replace(/\D/g, "");
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
    const selectedDateStr = e.target.value;
    setDate(selectedDateStr);
  };

  const formatPhone = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length === 11) {
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  const formatCnpjCpf = (value) => {
    const cnpjCpf = value.replace(/\D/g, "");
    if (cnpjCpf.length === 14) {
      return cnpjCpf.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    } else if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const addItem = () => {
    const newItem = {
      description: itemDescription,
      quantity: itemQuantity ? parseInt(itemQuantity) : "",
      color: itemColor,
    };
    setItems([...items, newItem]);
    clearInputs();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = date;
    const [year, month, day] = currentDate.split("-");

    const formattedDate = `${day}/${month}/${year}`;

    // Header
    doc.setFillColor(0, 152, 219);
    doc.rect(0, 0, 210, 35, "F");
    doc.setFont("Montserrat", "bold");
    doc.setFontSize(27);
    doc.setTextColor(255);
    doc.text("Vidraçaria Ambires", 18, 17);

    doc.setFont("Montserrat", "normal");

    // Data atual
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text(`Data: ${formattedDate}`, 20, 25);

    // Dados fixos e dinâmicos
    // Adicionar os dados fixos na coluna esquerda
    doc.setTextColor(0);
    doc.text(`Nome: Daniel Ambires da Silva`, 20, 50);
    doc.text(`CNPJ: 43.244.454/0001-10`, 20, 60);
    doc.text(`Telefone: (11) 94705-8537`, 20, 70);

    if (customerData.name || customerData.cnpj || customerData.phone) {
      doc.setLineWidth(1);
      doc.setDrawColor(204, 204, 204);
      doc.line(105, 45, 105, 80);
    }

    // Adicionar os dados dinâmicos na coluna direita
    const yPosCustomerDataNome = 50;
    const yPosCustomerDataCNPJ = 64;
    const yPosCustomerDataPhone = 74;

    if (customerData.name) {
      const maxWidth = 80;
      const customerNameLines = doc.splitTextToSize(
        `Nome: ${customerData.name}`,
        maxWidth
      );
      doc.text(customerNameLines, 120, yPosCustomerDataNome);
    }
    if (customerData.cnpj) {
      doc.text(
        `CNPJ/CPF: ${formatCnpjCpf(customerData.cnpj)}`,
        120,
        yPosCustomerDataCNPJ
      );
    }
    if (customerData.phone) {
      doc.text(
        `Telefone: ${formatPhone(customerData.phone)}`,
        120,
        yPosCustomerDataPhone
      );
    }

    // Tabela de Itens
    const tableData = items.map((item) => [
      {
        content: item.description,
        styles: { valign: "top", halign: "left" },
      },
      item.quantity,
      item.color,
    ]);
    doc.autoTable({
      startY: yPosCustomerDataPhone + 10,
      head: [["Descrição", "Quantidade", "Cor"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 152, 219],
      },
    });

    // Rodapé
    const startYFooter = Math.max(doc.autoTable.previous.finalY + 20);
    if (observations) {
      doc.text(`Observações: ${observations}`, 20, startYFooter);
    }
    doc.text(`Valor Total: ${totalAmount}`, 20, startYFooter + 15);

    doc.save(`orcamento${currentDate}.pdf`);
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
    setEditingIndex(-1);
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
        <span className="sub-titile">
          Se não colocar a data, como padrão é preenchido com a data de hoje!
        </span>
        <input type="date" value={date} onChange={handleDateChange} required />
        <h2>Dados do Cliente</h2>
        <div>
          <label>Nome:</label>
          <input
            type="text"
            name="name"
            placeholder="Preencha o nome do cliente"
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
            placeholder="Preencha o CNPJ ou CPF do cliente"
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
            placeholder="Preencha o telefone do cliente"
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
              <span className="icon">
                <FaPaperPlane />
              </span>
            </button>
          ) : (
            <div className="box-confirm-edit">
              <button className="button save-edit" onClick={saveItem}>
                Salvar
                <span className="icon">
                  <FaCheck />
                </span>
              </button>
              <button className="button cancel-edit" onClick={cancelEdit}>
                Cancelar
                <span className="icon">
                  <MdCancel />
                </span>
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
                      <span className="icon">
                        <FaEdit />
                      </span>
                    </button>
                    <button
                      className="button delete"
                      onClick={() => deleteItem(index)}
                    >
                      Excluir
                      <span className="icon">
                        <FaTrash />
                      </span>
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
              placeholder="Preencha as observações do orçamento"
            />
          </div>
          <div className="box-footer-totalAmount">
            <h2>Valor Total do Orçamento</h2>
            <input
              className="input-totalAmount"
              type="text"
              value={totalAmount}
              onChange={handleTotalAmountChange}
              placeholder="Preencha o valor do orçamento"
            />
          </div>
        </div>
        <button className="button generate-pdf" onClick={generatePDF}>
          Gerar PDF
          <span className="icon">
            <FaFilePdf />
          </span>
        </button>
      </div>
    </div>
  );
};

export default PDFGenerator;
