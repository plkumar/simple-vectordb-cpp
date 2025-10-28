#ifndef PRIORITY_QUEUE_H
#define PRIORITY_QUEUE_H

#include <vector>
#include <algorithm>
#include <functional>
#include <utility>

template<typename T, typename Compare = std::less<T>>
class PriorityQueue {
private:
    std::vector<T> elements;
    Compare compareFn;

    struct HeapComparator {
        Compare compareFn;
        bool operator()(const T& lhs, const T& rhs) const {
            // std::make_heap expects a comparator where the top is the "largest" element;
            // when using std::less it will create a max-heap. We want compareFn to describe
            // the ordering so use compareFn on lhs, rhs directly.
            return compareFn(lhs, rhs);
        }
    };

    HeapComparator heapComparator() const {
        return HeapComparator{ compareFn };
    }

public:
    PriorityQueue(std::vector<T> initElements = {}, Compare cmp = Compare())
        : elements(std::move(initElements)), compareFn(std::move(cmp)) {
        std::make_heap(elements.begin(), elements.end(), heapComparator());
    }

    void push(const T& element) {
        elements.push_back(element);
        std::push_heap(elements.begin(), elements.end(), heapComparator());
    }

    void push(T&& element) {
        elements.push_back(std::move(element));
        std::push_heap(elements.begin(), elements.end(), heapComparator());
    }

    T pop() {
        std::pop_heap(elements.begin(), elements.end(), heapComparator());
        T element = std::move(elements.back());
        elements.pop_back();
        return element;
    }

    const T& top() const {
        return elements.front();
    }

    bool isEmpty() const {
        return elements.empty();
    }

    size_t size() const {
        return elements.size();
    }
};

#endif // PRIORITY_QUEUE_H
